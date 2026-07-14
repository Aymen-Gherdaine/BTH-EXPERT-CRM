import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateNumeroOffre } from "@/lib/utils";
import { soumissionCreateSchema } from "@/lib/schemas";
import { validateBody } from "@/lib/schemas/helpers";
import { SOUMISSION_LIST_SELECT } from "@/lib/queries";
import { canCreateSoumission } from "@/lib/permissions";
import { sanitizeSearchTerm } from "@/lib/search";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

async function getRole(supabase: Awaited<ReturnType<typeof getSupabase>>, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single<{ role: string }>();
  return profile?.role;
}

export async function GET(req: NextRequest) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statut = searchParams.get("statut");
  const client_id = searchParams.get("client_id");

  // ── Mode paginé (serveur) : ?page (+ pageSize, q, sort, dir) ───────────────
  // Recherche, filtre, tri et pagination sont faits EN BASE : le client ne
  // reçoit qu'une page. Les KPIs globaux viennent du RPC soumissions_list_stats.
  const pageParam = searchParams.get("page");
  if (pageParam) {
    const page = Math.max(1, parseInt(pageParam, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const rawQ = searchParams.get("q")?.trim();
    const q = rawQ ? sanitizeSearchTerm(rawQ) : "";

    // Tri : colonne sur liste blanche uniquement (jamais d'entrée brute en ORDER BY)
    const sortParam = searchParams.get("sort") ?? "date_offre";
    const dirAsc = searchParams.get("dir") === "asc";
    const SORTABLE = new Set(["numero_offre", "titre_projet", "statut", "total_ttc", "date_offre"]);

    let pageQuery = supabase
      .from("soumissions")
      .select(SOUMISSION_LIST_SELECT, { count: "exact" });

    if (statut) pageQuery = pageQuery.eq("statut", statut);
    if (client_id) pageQuery = pageQuery.eq("client_id", client_id);

    // Recherche : colonnes parent + nom d'entreprise. L'entreprise étant sur la
    // table jointe, on résout d'abord les client_id correspondants puis on les
    // ajoute au OR (client_id.in.(…)).
    if (q) {
      const orParts = [`titre_projet.ilike.%${q}%`, `numero_offre.ilike.%${q}%`];
      const { data: matchedClients } = await supabase
        .from("clients")
        .select("id")
        .ilike("entreprise", `%${q}%`)
        .limit(1000);
      const ids = (matchedClients ?? []).map(c => c.id);
      if (ids.length) orParts.push(`client_id.in.(${ids.join(",")})`);
      pageQuery = pageQuery.or(orParts.join(","));
    }

    if (sortParam === "client") {
      pageQuery = pageQuery.order("entreprise", { referencedTable: "clients", ascending: dirAsc });
    } else {
      const col = SORTABLE.has(sortParam) ? sortParam : "date_offre";
      pageQuery = pageQuery.order(col, { ascending: SORTABLE.has(sortParam) ? dirAsc : false });
    }

    const { data, error, count } = await pageQuery.range(from, to);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // KPIs globaux (agrégats en base). Montants visibles par tous les rôles.
    const { data: statsData } = await supabase.rpc("soumissions_list_stats");
    const st = statsData?.[0];
    const kpis = {
      counts: {
        Brouillon: st?.count_brouillon ?? 0,
        "Envoyée": st?.count_envoyee ?? 0,
        "Acceptée": st?.count_acceptee ?? 0,
        "Refusée": st?.count_refusee ?? 0,
      },
      totalTTC: Number(st?.total_ttc ?? 0),
      totalVerse: Number(st?.total_verse ?? 0),
    };

    return NextResponse.json({ data: data ?? [], total: count ?? 0, kpis });
  }

  // ── Mode legacy (non paginé, borné) ────────────────────────────────────────
  // Conservé pour le dashboard, qui a besoin de la liste complète (listes
  // récentes + stats CP calculées côté client). Garde-fou .limit(1000).
  let query = supabase
    .from("soumissions")
    .select(SOUMISSION_LIST_SELECT)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (statut) query = query.eq("statut", statut);
  if (client_id) query = query.eq("client_id", client_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    // Création d'une soumission : réservée à l'administrateur.
    if (!canCreateSoumission(await getRole(supabase, user.id))) {
      return NextResponse.json({ error: "Action réservée aux administrateurs" }, { status: 403 });
    }

    const rawBody = await req.json();
    const validation = validateBody(soumissionCreateSchema, rawBody);
    if (!validation.success) return validation.response;
    const { formData, contexte } = validation.data;

    // 1. Upsert client
    const clientPayload = {
      titre: formData.step1.titre,
      nom_contact: formData.step1.nom_contact,
      poste: formData.step1.poste,
      entreprise: formData.step1.entreprise,
      adresse: formData.step1.adresse,
      ville: formData.step1.ville,
    };

    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .upsert(clientPayload, { onConflict: "entreprise,nom_contact" })
      .select()
      .single();

    let finalClient;
    if (clientError) {
      // Try to find existing client
      const { data: existingClient } = await supabase
        .from("clients")
        .select("*")
        .eq("entreprise", formData.step1.entreprise)
        .eq("nom_contact", formData.step1.nom_contact)
        .single();

      if (!existingClient) {
        const { data: newClient, error: insertError } = await supabase
          .from("clients")
          .insert(clientPayload)
          .select()
          .single();
        if (insertError) throw insertError;
        finalClient = newClient;
      } else {
        finalClient = existingClient;
      }
    } else {
      finalClient = clientData;
    }

    const total_ht = formData.step3.lignes.reduce(
      (s, l) => s + l.quantite * l.prix_unitaire,
      0
    );
    const tva = total_ht * 0.19;
    const total_ttc = total_ht + tva;

    // 2. Create soumission
    const { data: soumission, error: soumErr } = await supabase
      .from("soumissions")
      .insert({
        numero_offre: generateNumeroOffre(),
        date_offre: new Date().toISOString().split("T")[0],
        client_id: finalClient.id,
        titre_projet: formData.step2.titre_projet,
        secteur_activite: formData.step2.secteur_activite,
        description_projet: formData.step2.description_projet,
        type_etude: formData.step2.type_etude,
        delai_jours: formData.step2.delai_jours,
        total_ht,
        tva,
        total_ttc,
        statut: "Brouillon",
        contexte_genere: contexte ? JSON.stringify(contexte) : null,
      })
      .select()
      .single();

    if (soumErr) throw soumErr;

    // 3. Insert lignes budget
    if (formData.step3.lignes.length > 0) {
      const { error: lignesErr } = await supabase.from("lignes_budget").insert(
        formData.step3.lignes.map((l, i) => ({
          soumission_id: soumission.id,
          numero: l.numero,
          designation: l.designation,
          quantite: l.quantite,
          prix_unitaire: l.prix_unitaire,
          ordre: i,
          groupe: l.groupe ?? "Mission",
        }))
      );
      if (lignesErr) throw lignesErr;
    }

    return NextResponse.json({ success: true, data: soumission });
  } catch (error) {
    console.error("Erreur création soumission détail:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)))
    return NextResponse.json(
      { error: "Erreur lors de la création de la soumission",
        detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

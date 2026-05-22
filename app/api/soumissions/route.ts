import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateNumeroOffre } from "@/lib/utils";
import { soumissionCreateSchema } from "@/lib/schemas";
import { validateBody } from "@/lib/schemas/helpers";

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

async function canManageSoumissions(supabase: Awaited<ReturnType<typeof getSupabase>>, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single<{ role: string }>();

  return profile?.role === "admin" || profile?.role === "charge_projet";
}

export async function GET(req: NextRequest) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statut = searchParams.get("statut");
  const client_id = searchParams.get("client_id");

  let query = supabase
    .from("soumissions")
    .select("*, client:clients(*)")
    .order("created_at", { ascending: false });

  if (statut) query = query.eq("statut", statut);
  if (client_id) query = query.eq("client_id", client_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (!(await canManageSoumissions(supabase, user.id))) {
      return NextResponse.json({ error: "Action réservée aux administrateurs et chargés de projet" }, { status: 403 });
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
        contexte_genere: JSON.stringify(contexte),
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
        }))
      );
      if (lignesErr) throw lignesErr;
    }

    return NextResponse.json({ success: true, data: soumission });
  } catch (error) {
    console.error("Erreur création soumission:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la soumission" },
      { status: 500 }
    );
  }
}

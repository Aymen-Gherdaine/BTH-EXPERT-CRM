import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Client Supabase pour Server Components, mémoïsé PAR REQUÊTE via React cache().
 * Le layout et la page partagent ainsi la même instance (pas de re-création).
 */
export const createServerSupabase = cache(async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // En RSC l'écriture de cookies n'est pas autorisée → no-op silencieux.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
});

/**
 * Utilisateur VALIDÉ (getUser valide le jeton auprès du serveur d'auth Supabase),
 * mémoïsé par requête : un seul aller-retour réseau même si layout + page l'appellent.
 * NE PAS remplacer par getSession() (lecture cookie falsifiable).
 */
export const getServerUser = cache(async () => {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Profil (role, full_name) de l'utilisateur validé, mémoïsé par requête.
 * Le rôle est toujours lu côté serveur depuis la base (jamais fourni par le client).
 */
export const getServerProfile = cache(async () => {
  const user = await getServerUser();
  if (!user) return null;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();
  return data;
});

export function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return { supabase, response };
}

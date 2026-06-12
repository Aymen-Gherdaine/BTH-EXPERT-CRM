import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase-server";

const PUBLIC_ROUTES = ["/login", "/auth/callback", "/auth/set-password"];
const ADMIN_ONLY_PREFIXES = ["/admin/", "/soumissions/nouvelle"];
const EXPERT_PREFIXES = ["/couts-marges"];
const SETTINGS_PREFIX = "/parametres";

export async function proxy(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !PUBLIC_ROUTES.includes(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === "/login") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  const isAdminOnlyRoute = ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
  const isExpertRoute = EXPERT_PREFIXES.some((p) => pathname.startsWith(p));
  const isSettingsRoute = pathname.startsWith(SETTINGS_PREFIX);

  if (user && (isAdminOnlyRoute || isExpertRoute || isSettingsRoute)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: string }>();

    const role = profile?.role;
    const canAccess = isAdminOnlyRoute
      ? role === "admin"
      : role === "admin" || role === "charge_projet";

    if (!canAccess) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/dashboard";
      return NextResponse.redirect(redirect);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

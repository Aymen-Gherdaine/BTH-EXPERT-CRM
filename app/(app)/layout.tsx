import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import SWRProvider from "@/components/layout/SWRProvider";
import type { UserRole } from "@/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role: UserRole = (profile?.role as UserRole) ?? "admin";

  return (
    <SidebarProvider>
      <SWRProvider>
        <div className="flex h-screen bg-bth-canvas overflow-hidden">
          <Sidebar role={role} />
          <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[72px] md:pb-0">{children}</main>
          </div>
          <BottomNav role={role} />
        </div>
      </SWRProvider>
    </SidebarProvider>
  );
}

import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getServerUser, getServerProfile } from "@/lib/supabase-server";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import SWRProvider from "@/components/layout/SWRProvider";
import NavigationProgress from "@/components/layout/NavigationProgress";
import RouteSkeleton from "@/components/skeletons/RouteSkeleton";
import { ToastProvider } from "@/components/ui/Toast";
import type { UserRole } from "@/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getServerProfile();
  const role: UserRole = (profile?.role as UserRole) ?? "admin";

  return (
    <SidebarProvider>
      <SWRProvider>
        <ToastProvider>
          <NavigationProgress />
          <div className="flex h-screen bg-bth-canvas overflow-hidden">
            <Sidebar role={role} />
            <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[72px] md:pb-0">
                {/* Suspense dans le layout PERSISTANT : skeleton au cold load
                    (jamais blanc), mais React garde la page précédente pendant
                    les transitions → pas de flash entre onglets. */}
                <Suspense fallback={<RouteSkeleton />}>{children}</Suspense>
              </main>
            </div>
            <BottomNav role={role} />
          </div>
        </ToastProvider>
      </SWRProvider>
    </SidebarProvider>
  );
}

import { redirect } from "next/navigation";
import { getServerUser, getServerProfile } from "@/lib/supabase-server";
import type { UserRole } from "@/types";

export default async function ProspectionLayout({
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

  if (role !== "admin" && role !== "commercial") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}

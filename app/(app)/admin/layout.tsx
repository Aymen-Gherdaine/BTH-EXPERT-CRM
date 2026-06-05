import { redirect } from "next/navigation";
import { getServerUser, getServerProfile } from "@/lib/supabase-server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const profile = await getServerProfile();
  if (profile?.role !== "admin") redirect("/dashboard");

  return <>{children}</>;
}

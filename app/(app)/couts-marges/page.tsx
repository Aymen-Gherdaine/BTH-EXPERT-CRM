import { redirect } from "next/navigation";
import { getServerUser, getServerProfile } from "@/lib/supabase-server";
import CoutsMargesDashboard from "./CoutsMargesDashboard";

export default async function CoutsMargesPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const profile = await getServerProfile();
  if (profile?.role !== "admin") redirect("/dashboard");

  return <CoutsMargesDashboard />;
}

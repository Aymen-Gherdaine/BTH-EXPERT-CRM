import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  let query = supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `entreprise.ilike.%${q}%,nom_contact.ilike.%${q}%`
    );
  }

  const { data, error } = await query.limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

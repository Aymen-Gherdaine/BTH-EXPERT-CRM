import type { SupabaseClient } from "@supabase/supabase-js";
import { signatureObjectPath } from "./signature-url";

// SEC-05 — Téléchargement d'une signature côté serveur via le client
// service-role. Contrairement à un fetch() d'URL publique, download()
// fonctionne que le bucket `signatures` soit public OU privé, et n'expose
// jamais d'URL publique. Tolère les valeurs stockées en chemin nu ou en URL.
export async function downloadSignatureBuffer(
  admin: SupabaseClient,
  storedValue: string | null | undefined
): Promise<Buffer | null> {
  const path = signatureObjectPath(storedValue);
  if (!path) return null;
  try {
    const { data, error } = await admin.storage.from("signatures").download(path);
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  } catch {
    return null;
  }
}

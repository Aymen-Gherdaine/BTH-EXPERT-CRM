// SEC-05 — Résolution du chemin d'objet Storage d'une signature.
//
// La valeur stockée dans parametres.signature_*_url peut être, selon
// l'ancienneté de la donnée :
//   - un chemin d'objet nu :        "signature-responsable.png"
//   - une URL publique héritée :    ".../object/public/signatures/signature-responsable.png"
//   - une URL signée :              ".../object/sign/signatures/xxx.png?token=..."
//
// Cette fonction renvoie toujours le chemin RELATIF au bucket `signatures`,
// utilisable par download()/createSignedUrl(). Tolérante aux 3 formats.
export function signatureObjectPath(value: string | null | undefined): string | null {
  if (!value) return null;
  const marker = "/signatures/";
  const idx = value.indexOf(marker);
  const path = idx !== -1 ? value.slice(idx + marker.length) : value;
  return path.split("?")[0] || null;
}

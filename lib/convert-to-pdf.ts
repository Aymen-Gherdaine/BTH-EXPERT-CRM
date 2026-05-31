/**
 * Conversion DOCX → PDF via le service LibreOffice sur Render.
 * Remplace Cloudmersive : rend correctement headers, logos couleur, tableaux.
 */

const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL;   // ex: https://bth-pdf-service.onrender.com
const PDF_SERVICE_SECRET = process.env.PDF_SERVICE_SECRET; // le CONVERT_SECRET de Render

export async function convertDocxToPdf(docxBuffer: Buffer): Promise<Buffer> {
  if (!PDF_SERVICE_URL) {
    throw new Error("PDF_SERVICE_URL non configurée");
  }

  const res = await fetch(`${PDF_SERVICE_URL}/convert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(PDF_SERVICE_SECRET ? { Authorization: `Bearer ${PDF_SERVICE_SECRET}` } : {}),
    },
    body: JSON.stringify({ docxBase64: docxBuffer.toString("base64") }),
    // Render free tier peut avoir un cold start ~30s
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Service PDF: ${res.status} ${detail}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
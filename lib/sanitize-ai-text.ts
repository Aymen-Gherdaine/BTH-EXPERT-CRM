export function sanitizeAiText(text: string | null | undefined): string {
  if (!text) return ""
  return text
    // Remplace les accolades — risque d'injection docxtemplater
    .replace(/\{/g, "(")
    .replace(/\}/g, ")")
    // Normalise les sauts de ligne multiples (max 2 consécutifs)
    .replace(/\n{3,}/g, "\n\n")
    // Supprime les espaces en début et fin
    .trim()
}

// Recherche : neutralise les caractères qui ont un sens dans la syntaxe de
// filtre PostgREST (`.or(...)`, `.ilike(...)`) afin d'éviter qu'un terme de
// recherche `q` injecte des clauses de filtre supplémentaires. Les wildcards
// `%` du gabarit `%${q}%` sont ajoutés APRÈS ce nettoyage, donc la recherche
// « contient » reste fonctionnelle.
export function sanitizeSearchTerm(q: string): string {
  return q.replace(/[,()*\\%]/g, " ").trim();
}

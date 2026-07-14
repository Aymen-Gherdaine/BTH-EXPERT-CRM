// Fragments de `select` Supabase réutilisés, pour éviter la dérive entre points
// d'appel qui doivent renvoyer la même forme de données.
//
// NOTE : la chaîne doit rester UN SEUL littéral (pas de concaténation `+` ni de
// template) — c'est ce qui permet au typage de supabase-js de la parser à la
// compilation et d'inférer la forme des lignes. Une concaténation élargirait le
// type en `string` et casserait l'inférence (résultat typé GenericStringError).

// Colonnes de `soumissions` pour les vues LISTE (page /soumissions, dashboard,
// GET /api/soumissions). Équivalent à `*` SAUF `contexte_genere` : ce champ
// (JSON généré par l'IA, potentiellement volumineux) n'est lu QUE dans la page
// détail /soumissions/[id] via GET /api/soumissions/[id]. L'exclure des listes
// allège nettement le payload quand des dizaines/centaines de soumissions
// générées sont renvoyées d'un coup.
export const SOUMISSION_LIST_SELECT =
  "id, client_id, created_at, date_offre, delai_jours, description_projet, numero_offre, secteur_activite, statut, titre_projet, total_ht, total_ttc, tva, type_etude, versement_recu, client:clients(*)";

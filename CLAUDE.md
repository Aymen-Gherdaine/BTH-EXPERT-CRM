# BTH Hub — CRM de gestion des offres BTH Expert

## Stack
- Next.js 16.2.4 (App Router) + Tailwind CSS v4 + Framer Motion
- Supabase (PostgreSQL, Paris eu-west-3) + @supabase/ssr
- API Anthropic claude-sonnet-4-5 (génération IA)
- docxtemplater + pizzip (génération DOCX via template)
- Cloudmersive API (conversion DOCX → PDF)

## Conventions
- TypeScript strict — jamais de `any`
- Clés API uniquement dans `.env.local` (jamais dans le code)
- Supabase client : `lib/supabase-browser.ts` (client) / `lib/supabase-server.ts` (serveur/middleware)
- Couleur principale : `#1a2e1e` (vert BTH Expert)
- Nom app : **BTH Hub** (dans l'UI) / **BTH Expert** (dans les documents officiels générés)

## Génération de documents — ARCHITECTURE ACTUELLE
- Template Word : `templates/template-standard.docx` (variables `{xxx}` et boucle `{#lignes_budget}`)
- Génération DOCX : `lib/generate-document.ts` via docxtemplater
- Conversion PDF : `lib/convert-to-pdf.ts` via Cloudmersive (`process.env.CLOUDMERSIVE_API_KEY`)
- **NE PAS utiliser** jsPDF ni l'ancienne `lib/generate-pdf.ts` / `lib/generate-docx.ts`

## Variables template (template-standard.docx)
Client: `{titre}` `{nom_client}` `{nom_client_majuscule}` `{poste_client}` `{entreprise}` `{adresse}` `{ville}` `{code_postal}`
Offre: `{numero_offre}` `{date_offre}`
Projet (IA): `{titre_projet}` `{description_mission}` `{contexte_paragraphe_1}` `{contexte_paragraphe_2}`
Objectifs: `{objectif_1}` `{objectif_2}` `{objectif_3}` `{objectif_4}`
Hypothèses: `{hypothese_1}` `{hypothese_2_intro}` `{hypothese_2_a}` `{hypothese_2_b}` `{hypothese_3}` `{hypothese_4}`
Délais: `{delai_jours}` `{delai_jours_lettres}` `{validite_jours}` `{validite_jours_lettres}` `{tva_pct}`
Budget (boucle): `{#lignes_budget}` `{numero}` `{designation}` `{quantite}` `{prix_unitaire_formate}` `{/lignes_budget}`
Totaux: `{total_ht_formate}` `{tva_formate}` `{total_ttc_formate}`
Signataires: `{signataire_1_nom}` `{signataire_1_titre}` `{signataire_2_nom}` `{signataire_2_titre}`

## Format montants
Espace insécable + virgule : `100\u00A0000,00` — fonction `formatMontant(n)` dans `lib/utils.ts`

## Supabase — tables existantes
- `clients` : id, titre, nom_contact, poste, entreprise, adresse, ville, created_at
- `soumissions` : id, numero_offre, date_offre, client_id, titre_projet, secteur_activite, description_projet, type_etude, delai_jours, total_ht, tva, total_ttc, statut, contexte_genere, created_at
- `lignes_budget` : id, soumission_id, numero, designation, quantite, prix_unitaire, ordre
- `parametres` : id=1 (unique), nom_societe, adresse, signataire1_nom/titre, signataire2_nom/titre, signature_responsable_url, signature_autorise_url, tva_pct, delai_jours, validite_jours, modalites_paiement
- Bucket Storage : `avatars` (photos profil), `signatures` (signatures numérisées)

## Auth
- Middleware protège toutes routes sauf `/login` `/auth/callback` `/auth/set-password`
- Invitation Supabase → HashTokenRedirect → `/auth/set-password`
- Pas d'inscription publique (users créés manuellement dans Supabase dashboard)

## Commandes
```bash
npm run dev      # démarrer (localhost:3000)
npm run build    # vérifier compilation
```
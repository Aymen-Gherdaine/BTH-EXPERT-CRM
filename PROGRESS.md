# BTH Hub — Progression

Dernière mise à jour : 15 mai 2026 (session 8)

---

## ✅ TERMINÉ

### Infrastructure
- Next.js 16.2.4, Tailwind v4, Framer Motion, TypeScript strict
- Supabase (Paris eu-west-3), RLS activé, tables + policies créées
- Auth complète : login, invitation email, set-password, middleware
- Rebranding BTH Hub + couleurs `#1a2e1e`
- netlify.toml configuré
- RBAC complet : roles `admin` | `charge_projet` | `commercial`
- Middleware protège toutes les routes auth + routes admin (`/admin/*`, `/couts-marges`)
- `lib/supabase-admin.ts` — client service role pour opérations admin

### Pages & Composants
- **Dashboard** — stats réelles Supabase + 3 vues distinctes par rôle (voir session 7)
- **Soumissions** — liste paginée + filtres + nouvelle (4 étapes) + [id] + modal versement + export XLSX — UI premium redesign (session 8)
- **Clients** — tableau paginé → cards mobile-first premium redesign + suppression cascade + export XLSX (session 8)
- **Profil** — avatar, nom, password
- **Paramètres** — société, signataires, TVA, délais, signatures
- **Sidebar** — nav desktop + dropdown profil (photo, signout, paramètres) — voir session 7
- **Header** — mobile uniquement, badge relances — voir session 7
- **BottomNav** — mobile uniquement, role-aware — voir session 7
- **Prospection** — module complet (P-1 → P-4) :
  - Planning tableau 4 sections (Aujourd'hui / Cette semaine / Non traités / Sans relance)
  - Onglet "Tous" avec filtres, tri, pagination 10/page
  - Fiche prospect : historique visites, édition inline, suppression
  - Formulaire nouveau prospect 2 étapes animé
  - Export XLSX prospects
  - Badge relances urgentes dans le Header (admin + commercial)
- **Dépenses** — module complet (D-1 → D-4) :
  - Interface employé : ajout rapide, historique personnel, justificatif photo
  - Dashboard admin `/admin/depenses` : vue consolidée, filtres, marges par projet, export XLSX
- **Utilisateurs** `/admin/utilisateurs` :
  - Tableau utilisateurs : avatar, nom, email, badge rôle coloré, badge statut
  - Changement de rôle inline sans rechargement + animation checkmark
  - Désactivation / réactivation (soft delete — `is_active = false`)
  - Modal invitation (slide-up mobile, centré desktop) — 3 cartes rôle sélectionnables
  - Sécurité : impossible de modifier son propre rôle ou désactiver son propre compte

### API Routes
| Route | Description |
|-------|-------------|
| `GET/POST /api/prospects` | Prospects actifs avec visites |
| `GET/PATCH/DELETE /api/prospects/[id]` | Fiche prospect |
| `GET /api/prospects/export` | Export XLSX |
| `GET /api/prospects/alerts` | Count relances urgentes |
| `GET/POST /api/visites` | Visites |
| `PATCH/DELETE /api/visites/[id]` | Visite |
| `GET/POST /api/clients` | Clients |
| `GET/PATCH/DELETE /api/clients/[id]` | Client |
| `GET /api/clients/export` | Export XLSX |
| `GET/POST /api/soumissions` | Soumissions |
| `GET/PATCH/DELETE /api/soumissions/[id]` | Soumission |
| `GET /api/soumissions/export` | Export XLSX |
| `GET /api/dashboard` | Stats dashboard |
| `GET/POST /api/depenses` | Dépenses |
| `PATCH/DELETE /api/depenses/[id]` | Dépense |
| `GET /api/depenses/export` | Export XLSX admin |
| `GET /api/depenses/stats` | Stats marges admin |
| `GET /api/admin/users` | Liste utilisateurs (admin) |
| `POST /api/admin/users/invite` | Inviter utilisateur (admin) |
| `PATCH /api/admin/users/[id]` | Modifier rôle/statut (admin) |
| `DELETE /api/admin/users/[id]` | Désactiver utilisateur (admin) |
| `POST /api/generate` | Génération IA → `SoumissionAIContent` (15 champs structurés) |
| `POST /api/export/docx` | Export DOCX — accepte `editablePreview` ou `contexteData` (legacy) |
| `POST /api/export/pdf` | Export PDF Cloudmersive — idem |

### Génération documents
- `templates/template-standard.docx` — 35+ variables docxtemplater
- `lib/generate-document.ts` — docxtemplater + `nombreEnLettres()`
- `lib/convert-to-pdf.ts` — Cloudmersive

### Génération IA — Refonte complète (session 6)
- **`lib/anthropic.ts`** — remplacé intégralement : exporte `generateSoumissionContent()` retournant `SoumissionAIContent` (15 champs plats structurés)
  - Modèle : `claude-sonnet-4-5`, `max_tokens: 2048`
  - Prompt système avec vrais exemples AT PHARMA Phase II
  - Helper `getLivrablesParType(type)` pour livrables spécifiques selon TypeEtude
- **`SoumissionAIContent`** type : `contexte_paragraphe_1/2`, `objectif_1/2/3/4`, `livrable_1/2/3`, `hypothese_1/2/3`, `description_echeancier`, `inclusions_specifiques`, `exclusions_specifiques`
- **`/api/generate`** — mis à jour pour retourner `{ success, data: SoumissionAIContent }`

### Prévisualisation interactive (session 6 — Parts 1–7)
- **`types/index.ts`** — ajout type `EditablePreview` (22 champs : infos client + offre + toutes sections IA)
- **`components/soumissions/EditableSection.tsx`** — composant réutilisable :
  - Modes lecture / édition avec `AnimatePresence` + Framer Motion height expand
  - `AutoResizeTextarea` avec `useRef` + `useEffect`
  - Icône crayon hover-only desktop (`md:opacity-0 md:group-hover:opacity-100`)
  - Swap checkmark / crayon animé avec `AnimatePresence mode="wait"`
  - `renderContent` prop pour rendu lecture personnalisé par bloc
- **`components/forms/StepPreview.tsx`** — refonte complète (Parts 1–7) :
  - **Part 1** : état `editablePreview` initialisé depuis toutes les données du formulaire
  - **Part 2** : 8 blocs `EditableSection` avec couleurs accent (`#192D38`, `#3C7C95`, `#72AFC7`)
  - **Part 3** : un seul bloc actif à la fois — modale de confirmation si switch en cours d'édition
  - **Part 4** : auto-save silencieux vers Supabase via API routes auth :
    - section `client` → `PATCH /api/clients/[id]`
    - section `soumission` → `PATCH /api/soumissions/[id]`
    - section `ai` → `PATCH /api/soumissions/[id]` (champ `contexte_genere`)
    - Toast d'erreur 6 s si échec, état local toujours préservé
  - **Part 5** : export DOCX/PDF passe `editablePreview` directement (jamais de re-fetch)
  - **Part 6** : bouton "Régénérer les sections IA" :
    - Modale slide-up mobile / centré desktop (spring `damping:28, stiffness:320`)
    - Régénère uniquement sections IA — infos client/offre conservées
    - Animation flash `boxShadow` keyframe sur les 6 blocs IA après régénération
  - **Part 7** : indicateur `● Modifications non sauvegardées` (orange) dans le header
    - Apparaît dès qu'une section est éditée, disparaît après PATCH Supabase réussi
    - Persiste si auto-save échoue ou si IDs non disponibles (soumission pas encore créée)
  - `buildAIContent(preview)` : reconstruit `SoumissionAIContent` depuis `EditablePreview`
  - `initEditablePreview()` : mappe formulaire + réponse IA → état initial
  - `hypothese_specifique` : champ combiné H1+H2+H3 séparés par `\n\n`
  - `FlashWrapper` inner component : `motion.div` avec `boxShadow` keyframe array

### Export — Mise à jour (session 6)
- **`lib/export-helpers.ts`** :
  - `buildFromEditablePreview()` : mappe `EditablePreview` → `DocumentData`
    - `date_offre` passée directement (déjà formatée en français depuis l'état)
    - `hypothese_specifique` splitté en `hypothese_1/3/4` pour le template
  - `buildDocumentData()` : backward-compatible — si `editablePreview` présent → `buildFromEditablePreview`, sinon → path legacy avec `formatDateFr()`
- **`/api/export/docx`** et **`/api/export/pdf`** : acceptent `editablePreview?: EditablePreview` depuis le body — page `[id]` continue d'envoyer `contexteData` sans `editablePreview`
- **`/api/clients/[id]`** : ajout route `PATCH` (update inline client depuis preview)

### Session 7 — Refonte layout + Dashboard role-based (15 mai 2026)

#### Layout global — Bugs corrigés
- **Bug critique résolu** : `style={{ display: "flex" }}` en inline CSS écrasait les classes Tailwind `md:hidden` / `hidden`. Fix : déplacer `flex` dans le `className`, jamais en inline style pour les éléments responsive.
- **Header** (`components/layout/Header.tsx`) : visible uniquement mobile (`md:hidden flex`). Bug `display:"flex"` retiré du style inline.
- **BottomNav** (`components/layout/BottomNav.tsx`) : visible uniquement mobile (`md:hidden flex`). Même correction.
- **Sidebar** (`components/layout/Sidebar.tsx`) : visible uniquement desktop (`hidden md:flex flex-col`). Déjà corrigé.

#### Sidebar — Nouvelles fonctionnalités
- **Photo de profil** : `user.user_metadata?.avatar_url` → `<Image>` Next.js si présent, initiales en fallback uniquement
- **Dropdown profil** (clic sur la zone user en bas) : popup animée Framer Motion au-dessus du footer avec :
  - Info utilisateur (photo + nom + email)
  - Lien "Mon profil" → `/profil`
  - Lien "Paramètres" → `/parametres`
  - Bouton "Se déconnecter" → `supabase.auth.signOut()` + redirect `/login`
  - Chevron rotatif pour indiquer l'état ouvert/fermé
  - Fermeture au clic extérieur (ref + `mousedown`)

#### Dashboard — Refonte visuelle complète
- **Police** : Segoe UI system-ui partout (suppression Google Fonts — Syne, Figtree, DM Sans)
- **Hero** : banner vert foncé `#1a2e1e` sur tous les viewports (avatar initiales + rôle + nom + greeting). Sans boutons d'action.
- **Stat cards** : `fontSize: 18, fontWeight: 600` (vs 22/800 avant) — icône 28×28, label 11px uppercase, `boxShadow: "0 1px 3px rgba(0,0,0,.04)"`
- **Background** : `#f4f5f7` (gris neutre pro vs beige `#f2f1ec`)
- **Layout desktop** : deux colonnes `1fr 1fr` égales + bilan pleine largeur dessous
- **Bilan financier** : 3 colonnes avec séparateurs verticaux — identique mobile ET desktop (plus de stack 1-col mobile)

#### Dashboard — 3 vues par rôle

| | Admin | Chargé de projet | Commercial |
|---|---|---|---|
| KPI 1 | CA Mandats (DZD) | En brouillon (#) | Prospects actifs (#) |
| KPI 2 | Mandats acceptés (#) | En attente de réponse (#) | Relances urgentes (#) |
| KPI 3 | Offres ce mois (#) | Acceptées ce mois (#) | Prospects ce mois (#) |
| KPI 4 | Versements reçus (DZD) | CA en cours (DZD pipeline) | Convertis (#) |
| Col gauche | Soumissions récentes | Soumissions récentes | Relances urgentes |
| Col droite | Relances urgentes | **Offres en attente réponse** | Prospects récents |
| Dessous | Bilan financier | — | Soumissions récentes (sans montants) |

- **Chargé de projet** : suppression des relances urgentes (hors de son domaine), remplacement par liste des offres "Envoyée" avec délai d'envoi (alerte amber si > 14 jours).
- **Commercial** : vue 100% prospection. Soumissions récentes visibles en lecture (sans montants financiers).
- **SoumissionsClient** extrait en composant client séparé (page serveur → client).

---

## 🔧 PROBLÈME EN COURS — Fidélité visuelle documents

**Statut :** En investigation — travail en parallèle par Aymen

Le DOCX généré n'est pas visuellement identique au modèle original.
Nouveau modèle de référence reçu : `ODS_AT_PHARMAPhase_II.pdf` (soumission AT PHARMA Phase II).

**Plan d'action :**
Convertir le PDF AT PHARMA en Word → recréer `template-standard.docx` manuellement à partir de cette base.

**Causes probables :** template créé par script Python (styles Word cassés), texte IA non sanitizé, Cloudmersive gère mal Times New Roman / Arial.

**Solution définitive :** Migrer vers Render + LibreOffice headless (remplace Cloudmersive).

---

## ⚠️ MIGRATIONS SUPABASE EN ATTENTE

Ces SQL doivent être exécutés dans Supabase avant utilisation des fonctionnalités correspondantes :

```sql
-- Module Utilisateurs (session 5)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Session 4 — Module Soumissions
ALTER TABLE soumissions ADD COLUMN IF NOT EXISTS versement_recu NUMERIC(15,2) DEFAULT 0;

-- Session 4 — Contraintes CHECK (adapter selon valeurs existantes)
-- type_etude : ajouter 'Audit+RapportProduits'
-- resultat_visite : ajouter 'visite_expert_demandee'
```

## ⚠️ VARIABLES D'ENVIRONNEMENT EN ATTENTE

```
# .env.local — obligatoire pour les invitations utilisateurs
SUPABASE_SERVICE_ROLE_KEY=<clé service role Supabase>

# Netlify — à configurer avant déploiement
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
CLOUDMERSIVE_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 📋 RESTE À FAIRE — Priorité globale

### Haute (prochaines sessions)
1. ⬜ **Brancher paramètres sur les exports** — fetcher table `parametres` dans `/api/export/docx` et `/api/export/pdf` (signataires, TVA, délais actuellement codés en dur)
2. ⬜ **Refaire `template-standard.docx`** — recréer manuellement à partir du modèle AT PHARMA Phase II converti en Word
3. ✅ **Prévisualisation interactive avec édition inline** — TERMINÉ session 6 (Parts 1–7)

### Moyenne
4. ⬜ **Sanitizer texte IA** — nettoyer guillemets tordus, caractères spéciaux algériens avant injection dans docxtemplater
5. ⬜ **Prospect converti → soumission** — statut `converti` crée automatiquement une soumission pré-remplie avec les infos du prospect
6. ⬜ **Migrer vers LibreOffice headless** — Render + LibreOffice remplace Cloudmersive pour meilleure fidélité PDF
7. ⬜ **Template Sonatrach** — en attente d'exemple client

### Déploiement
8. ⬜ Supabase Redirect URLs : ajouter `https://bth-hub.netlify.app/auth/callback`
9. ⬜ Déploiement Netlify production

---

## Supabase — Tables existantes

- `clients` : id, titre, nom_contact, poste, entreprise, adresse, ville, created_at
- `soumissions` : id, numero_offre, date_offre, client_id, titre_projet, secteur_activite, description_projet, type_etude, delai_jours, total_ht, tva, total_ttc, versement_recu, statut, contexte_genere, created_at
- `lignes_budget` : id, soumission_id, numero, designation, quantite, prix_unitaire, ordre
- `parametres` : id=1 (unique), nom_societe, adresse, signataire1_nom/titre, signataire2_nom/titre, signature_responsable_url, signature_autorise_url, tva_pct, delai_jours, validite_jours, modalites_paiement
- `profiles` : id, email, full_name, avatar_url, role (`admin`|`charge_projet`|`commercial`), is_active (⚠️ migration requise)
- `prospects` : id, entreprise, secteur_activite, nom_contact, poste_contact, telephone, email, adresse, notes_generales, statut_global, created_by, created_at, updated_at
- `visites` : id, prospect_id (FK→prospects CASCADE), date_visite, resultat, notes_visite, date_prochaine_action, action_requise, commercial_id, created_at
- `depenses` : id, employe_id, categorie, montant, description, date_depense, justificatif_url, projet_lie, created_at
- Buckets Storage : `avatars`, `signatures`, `justificatifs`

---

## Variables template-standard.docx — Référence complète

```
Client   : {titre} {nom_client} {nom_client_majuscule} {poste_client} {entreprise} {adresse} {ville} {code_postal}
Offre    : {numero_offre} {date_offre}
Projet   : {titre_projet} {description_mission} {contexte_paragraphe_1} {contexte_paragraphe_2}
Objectifs: {objectif_1} {objectif_2} {objectif_3} {objectif_4}
Hypothèses: {hypothese_1} {hypothese_2_intro} {hypothese_2_a} {hypothese_2_b} {hypothese_3} {hypothese_4}
Délais   : {delai_jours} {delai_jours_lettres} {validite_jours} {validite_jours_lettres} {tva_pct}
Budget   : {#lignes_budget} {numero} {designation} {quantite} {prix_unitaire_formate} {/lignes_budget}
Totaux   : {total_ht_formate} {tva_formate} {total_ttc_formate}
Signat.  : {signataire_1_nom} {signataire_1_titre} {signataire_2_nom} {signataire_2_titre}
```

---

## Modèle AT PHARMA Phase II — Référence visuelle

Structure observée dans `ODS_AT_PHARMAPhase_II.pdf` :
- Header logo BTH EXPERT + ENVIRONNEMENT / INGÉNIERIE (coin haut droit)
- Adresse destinataire + numéro d'offre gras (T+JJMMAAAA)
- Objet avec titre et sous-titre couleur `#3C7C95`
- Sections numérotées avec sous-sections (1.1, 1.2, 1.3, 1.4)
- Tableaux budget multi-sections numérotés (4-1, 4-2, 4-3, 4-4) + récapitulatif TVA 19%
- Page signatures : 2 colonnes (Responsable / Autorisé par) avec images signatures
- Footer "BTH EXPERT" centré + numéro de page

---

## Fichiers sensibles — NE PAS MODIFIER

`templates/template-standard.docx` · `lib/anthropic.ts` · `middleware.ts` · `lib/supabase-browser.ts` · `lib/supabase-server.ts` · `.env.local`

---

## Commits session 6 (10 mai 2026)

| Hash | Description |
|------|-------------|
| `922636f` | feat: inline editing, export via editablePreview, AI regeneration on preview step (Parts 1–6) |
| `07e4e37` | feat: add section-by-section inline editing to submission preview with auto-save (Part 7 + build) |

## Commits session 7 (15 mai 2026)

| Hash | Description |
|------|-------------|
| `3b063c7` | fix: fix all preview and editing in the soumission section |
| `fa3ce00` | feat: redesign layout, dashboard, and role-based views |

## Session 8 — Redesign UI Soumissions + Clients (15 mai 2026)

### Soumissions — `SoumissionsClient.tsx`

#### PremiumTable (vue tableau)
- Header blanc/gris clair `#fafafa` + dividers fins `#eaecef` entre colonnes (plus de header vert)
- Lignes : `alignItems: stretch` sur CSS Grid → dividers `1px solid #f0f2f5` pleine hauteur sans layout shift
- Hover : `boxShadow: "inset 3px 0 0 #1a2e1e"` (accent gauche sans décalage de layout)
- Actions (dupliquer / supprimer) toujours visibles (`opacity: 1`)
- Footer 3 colonnes : count soumissions | pagination Page X/Y | Total TTC (admin seulement)
- Marge 20px en bas + `borderRadius: 16` (coins arrondis sur tous les angles)
- Tri par colonne avec indicateur directionnel

#### StatusBadge
- `borderRadius: 5` (pas pill), border colorée par statut, dot 5px

#### Versement (statut "Acceptée")
- Progress bar verte 2px animée (Framer Motion) + `"{N} versé"` en vert sous le montant

#### Délai
- `"60"` en fontWeight 700 + `"jours"` en gris 10.5px (plus de chip)

#### CardGrid (vue cards — mobile)
- `gridTemplateColumns: repeat(auto-fill, minmax(min(300px, 100%), 1fr))` — responsive sans overflow
- Padding adaptatif `20px ${px}px 28px` (32px desktop / 20px mobile)

#### Pagination (Pager)
- Toujours visible même sur 1 page (affiche "Page 1/1" avec boutons désactivés)
- Pinned en bas de l'écran : layout `height: 100%` flex-column, `CardGrid` scrolle en interne, `Pager` `flexShrink: 0` en dehors du scroll

### Clients — `app/(app)/clients/page.tsx`

Réécriture complète : de table Tailwind → cards mobile-first premium

#### ClientCard
- Avatar 44px cercle coloré (hash sur nom entreprise) — 7 couleurs BTH
- Nom entreprise (fontWeight 700) + titre + contact + poste
- Meta chips : icône map-pin + ville, icône calendrier + date client depuis
- Bouton suppression toujours visible (couleur rouge au hover)
- Chevron animé (rotation 180° via Framer Motion) pour expand/collapse
- Transition border + boxShadow sur expand

#### Expanded soumissions
- Fond `#fafafa`, border-top séparateur
- Adresse en chip si disponible
- Liste soumissions : left accent bar colorée par statut + titre + numéro offre + StatusBadge
- Skeleton 2 barres animées pendant chargement

#### Layout / Pagination
- Root `height: 100%` flex-column — liste scrolle en interne (`flex: 1, overflowY: auto`)
- Pagination bar `flexShrink: 0` toujours collée en bas (hors du scroll) : count + `Page X/Y`
- Background `#faf9f7`
- Skeleton loading (5 barres animées `@keyframes sk`)
- Empty state avec icône user

## Commits session 8 (15 mai 2026)

| Hash | Description |
|------|-------------|
| `973b274` | feat: redesign soumissions & clients UI with sticky bottom pagination |
| `44b39a0` | fix: add margin-bottom and full border-radius to soumissions table |

# BTH Hub — Progression

Dernière mise à jour : 7 mai 2026 (session 5)

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
- **Dashboard** — stats réelles Supabase (soumissions, mandats acceptés count+montant, versements, taux)
- **Soumissions** — liste paginée + filtres + nouvelle (4 étapes) + [id] + modal versement + export XLSX
- **Clients** — tableau paginé + suppression cascade + export XLSX
- **Profil** — avatar, nom, password
- **Paramètres** — société, signataires, TVA, délais, signatures
- **Sidebar** + **Header** (dropdown user, badge relances)
- **BottomNav** mobile fixe, role-aware
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
| `POST /api/generate` | Génération IA Anthropic |
| `POST /api/export/docx` | Export DOCX |
| `POST /api/export/pdf` | Export PDF Cloudmersive |

### Génération documents
- `templates/template-standard.docx` — 35+ variables docxtemplater
- `lib/generate-document.ts` — docxtemplater + `nombreEnLettres()`
- `lib/convert-to-pdf.ts` — Cloudmersive

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
3. ⬜ **Page relecture IA** — permettre d'éditer le texte généré avant d'exporter le DOCX

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

`templates/template-standard.docx` · `lib/anthropic.ts` · `lib/supabase-browser.ts` · `lib/supabase-server.ts` · `.env.local`

# BTH Hub — Progression

Dernière mise à jour : 3 mai 2026 (session 2)

---

## ✅ TERMINÉ

### Infrastructure
- Next.js 16.2.4, Tailwind v4, Framer Motion, TypeScript strict
- Supabase (Paris eu-west-3), RLS activé, tables + policies créées
- Auth complète : login, invitation email, set-password, middleware
- Rebranding BTH Hub + couleurs `#1a2e1e`
- netlify.toml configuré

### Pages & Composants
- Dashboard (stats vides pour l'instant)
- Soumissions : liste + nouvelle (formulaire 4 étapes) + [id]
- Clients, Profil (avatar, nom, password), Paramètres (société, signataires, TVA, délais, signatures)
- Sidebar + Header avec dropdown user
- BottomNav mobile fixe (md:hidden), role-aware
- Module Prospection complet (P-1 → P-3)
  - RBAC rôles admin / charge_projet / commercial
  - Tables `prospects` + `visites` avec RLS Supabase
  - UI Planning (Aujourd'hui / Cette semaine / Non traités) + Tous (groupé par date)
  - Fiche prospect : historique visites, édition, suppression
  - Formulaire nouveau prospect 2 étapes animé
  - Composants ProspectCard, PlanningZone, VisiteForm
- Module Prospection — améliorations session 2 :
  - Édition + suppression prospect depuis la fiche `/prospection/[id]`
  - Suppression prospect depuis le tableau "Tous" (menu ⋮)
  - API DELETE `/api/prospects/[id]` ajoutée
  - Onglet "Tous" : tableau avec filtres (secteur, résultat, tri) + pagination 10/page
  - Sidebar/Header sticky (h-screen + overflow-hidden sur layout)
  - Clients : même style tableau que soumissions + pagination 10/page
  - Soumissions : pagination 10/page ajoutée
  - Selects avec flèche SVG custom (`appearance-none` + chevron absolu)

### API Routes
- `/api/generate` — génération IA Anthropic
- `/api/export/docx` et `/api/export/pdf`
- `/api/soumissions`, `/api/clients`, `/api/dashboard`

### Génération documents
- `templates/template-standard.docx` créé avec 35+ variables
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

## 📋 MODULE PROSPECTION — Plan de développement

> Contexte : Le commercial de BTH Expert gère ses prospects dans un cahier papier.
> Objectif : Remplacer le cahier par une base de données structurée avec alertes de relance.
> Valeur long terme : base sectorielle complète d'entreprises à Oran — avantage concurrentiel
> majeur lors de nouvelles réglementations environnementales algériennes.

### ⚠️ Ordre des tâches non négociable : P-1 → P-2 → P-3 → P-4

---

### Tâche P-1 — Système de rôles RBAC ✅ TERMINÉ

**Pourquoi en premier :** navigation conditionnelle + sécurité des routes dépendent du rôle.

Actions :
- Créer type enum `user_role` dans Supabase : `admin` | `charge_projet` | `commercial`
- Ajouter colonne `role user_role DEFAULT 'admin'` dans table `profiles`
- Mettre à jour `middleware.ts` pour lire le rôle et rediriger correctement
- Conditionner navigation du header selon rôle connecté
- Protéger les API routes avec vérification côté serveur

Commit : `feat: add RBAC role system (admin/charge_projet/commercial)`

---

### Tâche P-2 — Tables Supabase + API routes ✅ TERMINÉ

**Pourquoi en second :** l'UI P-3 a besoin de vraies données. Mocks = travail en double.

Actions :
- Créer table `prospects` (schéma dans CLAUDE.md)
- Créer table `visites` avec FK CASCADE vers prospects (schéma dans CLAUDE.md)
- Policies RLS : commercial voit ses propres entrées, admin voit tout
- Générer types TypeScript depuis Supabase
- Créer `GET/POST /api/prospects` et `GET/POST /api/visites`

Commit : `feat: add prospects and visites tables with RLS and API routes`

---

### Tâche P-3 — Interface Prospection mobile-first + Framer Motion ✅ TERMINÉ

**Standard : UI/UX Pro Max. Mobile-first absolu. Framer Motion systématique.**

Écrans :
- `/prospection` — Dashboard planning 3 zones :
  - 🔴 **En retard** : `date_prochaine_action < today`
  - 🔵 **Aujourd'hui** : `date_prochaine_action = today`
  - ⚪ **Cette semaine** : `date_prochaine_action` entre demain et +7j
- `/prospection/nouveau` — Formulaire saisie rapide 2 étapes (entreprise → visite)
- `/prospection/[id]` — Fiche prospect + historique complet des visites

Composants :
- `ProspectCard` — carte animée Framer Motion
- `VisiteForm` — touch-friendly (boutons min 44px), résultat = 4 gros boutons
- `PlanningZone` — section colorée + liste de cartes animées

Commit : `feat: add Prospection module with mobile-first UI and Framer Motion`

---

### Tâche P-4 — Export Excel + Badge alertes ⬜ À faire

Actions :
- `GET /api/prospects/export` → fichier .xlsx via SheetJS
  Colonnes : Entreprise, Secteur, Contact, Téléphone, Adresse, Dernière visite, Prochain contact, Statut
- Bouton "Exporter" dans `/prospection`
- Badge rouge dans header = count relances en retard + aujourd'hui
- Badge visible : rôles `commercial` et `admin` uniquement

Commit : `feat: add prospects Excel export and relance badge`

---

## 📋 RESTE À FAIRE — Priorité globale

### Haute (prochaines sessions)
1. ✅ P-1 : Système de rôles RBAC
2. ✅ P-2 : Tables prospects + visites + API routes
3. ✅ P-3 : Interface Prospection mobile-first
4. ⬜ **P-4 : Export Excel + badge alertes header**
   - `GET /api/prospects/export` → .xlsx via SheetJS (Entreprise, Secteur, Contact, Tel, Adresse, Dernière visite, Prochain contact, Statut)
   - Bouton "Exporter" dans `/prospection`
   - Badge rouge header = count relances en retard + aujourd'hui (rôles commercial + admin)
5. ⬜ **Dashboard — vraies stats Supabase** (nb soumissions, CA total, taux acceptation, prospects actifs)
6. ⬜ **Brancher paramètres sur les exports** (fetcher table `parametres` dans routes API export DOCX/PDF)
7. ⬜ **Refaire `template-standard.docx`** à partir du modèle AT PHARMA Phase II

### Moyenne
8. ⬜ Migrer vers Render + LibreOffice headless (remplace Cloudmersive — meilleure fidélité PDF)
9. ⬜ Sanitizer texte IA avant injection template (caractères spéciaux, guillemets)
10. ⬜ UX soumissions : filtres par statut/date, modifier, dupliquer, supprimer
11. ⬜ Page édition contenu IA avant téléchargement (relecture avant export)
12. ⬜ Template détaillé type Sonatrach (en attente exemple client)
13. ⬜ Prospects : statut `converti` → lien automatique vers soumission créée

### Déploiement
14. ⬜ Variables Netlify : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, `CLOUDMERSIVE_API_KEY`
15. ⬜ Supabase Redirect URLs : ajouter `https://bth-hub.netlify.app/auth/callback`
16. ⬜ Déploiement Netlify production

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

## Supabase — Tables existantes

- `clients` : id, titre, nom_contact, poste, entreprise, adresse, ville, created_at
- `soumissions` : id, numero_offre, date_offre, client_id, titre_projet, secteur_activite, description_projet, type_etude, delai_jours, total_ht, tva, total_ttc, statut, contexte_genere, created_at
- `lignes_budget` : id, soumission_id, numero, designation, quantite, prix_unitaire, ordre
- `parametres` : id=1 (unique), nom_societe, adresse, signataire1_nom/titre, signataire2_nom/titre, signature_responsable_url, signature_autorise_url, tva_pct, delai_jours, validite_jours, modalites_paiement
- `profiles` : id, email, full_name, avatar_url, role (`admin`|`charge_projet`|`commercial`)
- `prospects` : id, entreprise, secteur_activite, nom_contact, poste_contact, telephone, email, adresse, notes_generales, statut_global, created_by, created_at, updated_at
- `visites` : id, prospect_id (FK→prospects CASCADE), date_visite, resultat, notes_visite, date_prochaine_action, action_requise, commercial_id, created_at
- Buckets Storage : `avatars`, `signatures`

---

## Fichiers sensibles — NE PAS MODIFIER

`templates/template-standard.docx` · `lib/anthropic.ts` · `lib/supabase-browser.ts` · `lib/supabase-server.ts` · `middleware.ts` · `.env.local`
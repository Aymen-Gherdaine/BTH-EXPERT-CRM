# BTH Hub — CRM Interne

> Générateur de soumissions professionnelles pour **BTH Expert**, bureau d'études environnemental (Algérie).

Le chargé de projet remplit un formulaire → l'outil génère automatiquement une soumission Word/PDF identique au modèle officiel de l'entreprise → téléchargement en un clic.

---

## Sommaire

- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Base de données Supabase](#base-de-données-supabase)
- [Lancer le projet](#lancer-le-projet)
- [Structure du projet](#structure-du-projet)
- [Fonctionnalités](#fonctionnalités)
- [Génération de documents](#génération-de-documents)
- [Déploiement](#déploiement)
- [Roadmap](#roadmap)

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16.2.4 (App Router) |
| Langage | TypeScript |
| Styles | Tailwind CSS v4 |
| Animations | Framer Motion |
| Base de données | Supabase (PostgreSQL + Auth + Storage) |
| IA | Anthropic Claude API |
| Génération DOCX | docxtemplater + pizzip |
| Conversion PDF | Cloudmersive API (provisoire) |
| Déploiement | Netlify |

---

## Prérequis

- **Node.js** ≥ 18.17
- **npm** ≥ 9
- Un compte [Supabase](https://supabase.com)
- Une clé API [Anthropic](https://console.anthropic.com)
- Une clé API [Cloudmersive](https://cloudmersive.com)

---

## Installation

```bash
# 1. Cloner le repo
git clone https://github.com/Aymen-Gherdaine/BTH-EXPERT-CRM.git
cd BTH-EXPERT-CRM

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# → Remplir .env.local avec vos clés (voir section suivante)

# 4. Appliquer les migrations Supabase
# → Voir section "Base de données Supabase"

# 5. Lancer en développement
npm run dev
```

---

## Variables d'environnement

Copier `.env.example` en `.env.local` et remplir chaque valeur.

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...          # Clé publique (safe côté client)
SUPABASE_SERVICE_ROLE_KEY=eyJ...              # ⚠️ JAMAIS exposée côté client

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Cloudmersive (conversion PDF)
CLOUDMERSIVE_API_KEY=...
```

> **⚠️ Sécurité** — Ne jamais committer `.env.local`. Le fichier est dans `.gitignore`. Si des clés sont accidentellement exposées, les révoquer immédiatement dans les dashboards respectifs.

### Où trouver les clés

| Clé | Emplacement |
|---|---|
| `SUPABASE_URL` + `ANON_KEY` | Supabase Dashboard → Settings → API |
| `SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| `CLOUDMERSIVE_API_KEY` | [cloudmersive.com](https://cloudmersive.com) → Account → API Keys |

---

## Base de données Supabase

### Tables requises

| Table | Description |
|---|---|
| `clients` | Entreprises et contacts clients |
| `soumissions` | Offres de service générées |
| `lignes_budget` | Lignes de devis liées aux soumissions |
| `parametres` | Configuration globale (société, signataires, TVA) |

### Appliquer les migrations

```bash
# Option A — Via Supabase CLI
npx supabase db push

# Option B — Manuellement dans l'éditeur SQL Supabase
# Copier et exécuter les fichiers dans supabase/migrations/ dans l'ordre
```

### Buckets Storage requis

Créer manuellement dans Supabase Dashboard → Storage :

| Bucket | Visibilité | Usage |
|---|---|---|
| `avatars` | Public | Photos de profil utilisateurs |
| `signatures` | **Privé** | Signatures numérisées des gérants |

> **Important** — Le bucket `signatures` doit être **privé**. Les signatures sont des données sensibles utilisées sur des documents officiels.

### Politiques RLS

RLS est activé sur toutes les tables. Les policies utilisent `auth.uid()` pour restreindre l'accès aux données de l'utilisateur connecté. La table `parametres` est restreinte aux admins.

### Générer les types TypeScript

Après chaque modification du schéma, regénérer les types :

```bash
npx supabase gen types typescript --project-id [project-id] > types/database.types.ts
```

---

## Lancer le projet

```bash
# Développement
npm run dev          # http://localhost:3000

# Build de production
npm run build

# Vérification TypeScript
npm run type-check

# Tests
npm run test         # Vitest
```

---

## Structure du projet

```
BTH-EXPERT-CRM/
│
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Pages login, set-password
│   ├── (app)/                    # Pages protégées (dashboard, soumissions...)
│   │   ├── layout.tsx            # Shell UI avec sidebar + header
│   │   ├── soumissions/
│   │   ├── clients/
│   │   ├── profil/
│   │   └── parametres/
│   └── api/                      # API Routes
│       ├── export/docx/          # Génération DOCX
│       ├── export/pdf/           # Conversion PDF
│       ├── soumissions/          # CRUD soumissions
│       └── clients/              # CRUD clients
│
├── components/                   # Composants UI partagés
│   └── forms/                    # Formulaire multi-étapes soumission
│
├── lib/                          # Infrastructure
│   ├── supabase-browser.ts       # Client Supabase côté client
│   ├── supabase-server.ts        # Client Supabase côté serveur
│   ├── anthropic.ts              # Service Anthropic
│   ├── generate-document.ts      # Génération DOCX (docxtemplater)
│   └── convert-to-pdf.ts         # Conversion PDF (Cloudmersive)
│
├── templates/
│   └── template-standard.docx   # Template Word maître (ne pas modifier)
│
├── types/                        # Types TypeScript globaux
├── supabase/migrations/          # Migrations SQL
├── middleware.ts                 # Protection des routes
└── .env.example                  # Template des variables d'environnement
```

---

## Fonctionnalités

### Phase 1 — Actuelle

- **Authentification** — Login, invitation par email, reset mot de passe
- **Formulaire soumission 4 étapes** — Infos client → Projet → Budget → Prévisualisation
- **Génération IA** — Claude génère le contexte, les objectifs et l'intro du projet
- **Export DOCX** — Génération d'un fichier Word identique au modèle BTH Expert
- **Export PDF** — Conversion via Cloudmersive
- **Historique CRM** — Liste et détail de toutes les soumissions
- **Gestion clients** — CRUD complet
- **Page Profil** — Avatar, nom, mot de passe
- **Paramètres société** — Logo, signataires, signatures, TVA, délais

### Phase 2 — Planifiée

- Générateur de rapports environnementaux (EIE, EDD)

### Phase 3 — Planifiée

- Suivi de projets
- Facturation
- Portail client

---

## Génération de documents

### Template DOCX

Le fichier `templates/template-standard.docx` est le template maître. **Ne pas le modifier directement** — les variables sont injectées via docxtemplater.

Variables disponibles dans le template :

```
Client      : {titre} {nom_client} {entreprise} {adresse} {ville}
Offre       : {numero_offre} {date_offre}
Projet (IA) : {titre_projet} {description_mission} {contexte_paragraphe_1}
Objectifs   : {objectif_1} {objectif_2} {objectif_3} {objectif_4}
Budget      : {#lignes_budget} {numero} {designation} {quantite} {prix_unitaire_formate} {/lignes_budget}
Totaux      : {total_ht_formate} {tva_formate} {total_ttc_formate}
Signataires : {signataire_1_nom} {signataire_1_titre} {signataire_2_nom} {signataire_2_titre}
```

### Numéro d'offre

Format automatique : `T` + `JJMMAAAA` (ex: `T30042026`). Généré une seule fois côté client au montage du formulaire et réutilisé pour DOCX et PDF.

### Format des montants

Espace insécable (`\u00A0`) + virgule décimale → `100 000,00 DZD`

---

## Déploiement

### Netlify (actuel)

```toml
# netlify.toml — déjà configuré
[build]
  command = "npm run build"
  publish = ".next"
```

Variables d'environnement à configurer dans Netlify Dashboard → Site Settings → Environment Variables (les mêmes que `.env.local`).

### URL de callback Supabase

Dans Supabase Dashboard → Authentication → URL Configuration :

```
Site URL        : https://[votre-domaine].netlify.app
Redirect URLs   : https://[votre-domaine].netlify.app/auth/callback
                  http://localhost:3000/auth/callback
```

---

## Roadmap

Voir le fichier `PROGRESS.md` pour l'état détaillé des tâches en cours.

**Priorités immédiates :**
1. Nettoyage sécurité (RLS, validation inputs, rate limiting)
2. Fidélité visuelle des documents générés
3. Migration PDF vers LibreOffice (Render)
4. Tests unitaires fonctions financières

---

## Auteur

Développé par **Aymen Gherdaine** pour **BTH Expert SARL** — Algérie.

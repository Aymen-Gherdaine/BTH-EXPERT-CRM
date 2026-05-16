# BTH Hub — CRM BTH Expert · Documentation Architecture

## Mindmap Mermaid

```mermaid
mindmap
  root((BTH Hub<br/>CRM))
    Modules Métier
      Soumissions
        Liste & filtres statut
        Nouvelle soumission<br/>4 étapes
        Détail / Édition
        Export DOCX / PDF
      Clients
        Annuaire client
        Recherche entreprise
        Export XLSX
      Prospection
        Pipeline commercial
        Nouveau prospect
        Fiche prospect + visites
        Alertes relances
        Export XLSX
      Dépenses
        Saisie dépense
        Revue admin
        Coûts & marges
        Export XLSX
      Dashboard
        KPIs mensuels
        Taux d'acceptation
        Mandats acceptés
    Technologie
      Framework
        Next.js 16.2.4<br/>App Router
        TypeScript strict
        Tailwind CSS v4
        Framer Motion
      Base de données
        Supabase PostgreSQL<br/>eu-west-3
        Auth Supabase<br/>email + password
        RLS Row Level Security
        Storage<br/>avatars + signatures
      IA
        Anthropic Claude<br/>Sonnet 4.5
        Génération contexte
        Objectifs + livrables
        Hypothèses
      Documents
        docxtemplater<br/>template DOCX
        PizZip
        Cloudmersive API<br/>DOCX → PDF
      Export
        XLSX via xlsx lib
        DOCX download
        PDF download
    Architecture
      app/(app)
        layout.tsx<br/>auth + RBAC
        dashboard/
        soumissions/
        clients/
        prospection/
        depenses/
        admin/
        couts-marges/
        parametres/
        profil/
      app/(auth)
        login/
        auth/set-password/
      app/api
        /soumissions CRUD
        /clients CRUD
        /prospects CRUD
        /visites CRUD
        /depenses CRUD
        /generate AI
        /export pdf+docx
        /admin/users
        /dashboard stats
      components/
        layout/<br/>Sidebar Header BottomNav
        auth/<br/>LoginForm HashTokenRedirect
        forms/<br/>Step1..4 wizard
        soumissions/<br/>EditableSection
        prospection/<br/>Card Form Planning
      lib/
        anthropic.ts
        generate-document.ts
        convert-to-pdf.ts
        export-helpers.ts
        utils.ts
        supabase-*.ts x4
    Rôles RBAC
      admin
        Tout accès
        Gestion utilisateurs
        Coûts & marges
        Revue dépenses
      charge_projet
        Soumissions + clients
        Dashboard
      commercial
        Prospection uniquement
        Ses dépenses
    Flux Principal
      Formulaire 4 étapes
        Étape 1 Client
        Étape 2 Projet
        Étape 3 Budget
        Étape 4 Aperçu IA
      Génération IA
        Claude Sonnet 4.5
        Contexte FR
        Objectifs FR
        Hypothèses FR
        Livrables FR
      Export Document
        buildDocumentData
        generateDocument DOCX
        convertToPdf via Cloudmersive
        Download navigateur
    Base de données
      clients
        id titre nom poste
        entreprise adresse ville
      soumissions
        numero_offre statut
        total_ht tva total_ttc
        contexte_genere JSON
      lignes_budget
        designation quantite
        prix_unitaire ordre
      prospects
        entreprise contact
        statut_global
      visites
        date_visite resultat
        date_prochaine_action
      depenses
        categorie montant
        projet_lie
      profiles
        role is_active
      parametres
        signataires TVA
        validite delai
```

---

## Architecture — Vue textuelle pour entrevue

### Présentation en 3 phrases

**BTH Hub** est un CRM interne pour BTH Expert, cabinet de conseil en environnement algérien. Il permet de gérer le cycle complet d'une offre commerciale : de la prospection terrain jusqu'à la génération automatique du document de soumission professionnel en DOCX/PDF, avec rédaction assistée par IA (Claude). L'application est construite sur Next.js App Router + Supabase + Tailwind, déployable sur Vercel.

---

## Routes API — Diagramme de flux

```mermaid
flowchart TD
    User([Utilisateur]) --> FE[Next.js Frontend]
    
    FE --> |GET /api/dashboard| DASH[Dashboard Stats]
    FE --> |POST /api/generate| AI[Claude Sonnet 4.5<br/>lib/anthropic.ts]
    FE --> |POST /api/soumissions| CREATE[Créer soumission]
    FE --> |PATCH /api/soumissions/id| EDIT[Modifier soumission]
    FE --> |POST /api/export/docx| DOCX[Generate DOCX<br/>docxtemplater]
    FE --> |POST /api/export/pdf| PDF[Convert PDF<br/>Cloudmersive]
    FE --> |GET /api/clients| CLIENTS[Liste clients]
    FE --> |POST /api/prospects| PROSP[Créer prospect]
    FE --> |POST /api/visites| VISIT[Logger visite]
    FE --> |POST /api/depenses| DEP[Saisir dépense]
    FE --> |GET /api/depenses/stats| STATS[Coûts & marges]
    FE --> |POST /api/admin/users/invite| INV[Inviter utilisateur<br/>Service Role]

    CREATE --> |upsert client + insert soumission + lignes| DB[(Supabase<br/>PostgreSQL)]
    EDIT --> DB
    CLIENTS --> DB
    PROSP --> DB
    VISIT --> DB
    DEP --> DB
    DASH --> DB
    STATS --> DB

    AI --> |SoumissionAIContent JSON| FE
    DOCX --> |Buffer DOCX| FE
    PDF --> |Buffer PDF| FE
    INV --> |Auth Admin API| SUPA[Supabase Auth]

    DB --> |RLS vérifié| DB
    SUPA --> |Email invitation| Email([Email utilisateur])
```

---

## Flux bout-en-bout — Génération de soumission

```mermaid
sequenceDiagram
    actor U as Chargé de projet
    participant F as Frontend (4 steps)
    participant API as /api/generate
    participant Claude as Claude Sonnet 4.5
    participant DB as Supabase DB
    participant DocAPI as /api/export/docx
    participant PdfAPI as /api/export/pdf
    participant Cloud as Cloudmersive API

    U->>F: Étape 1 — Infos client (nom, entreprise, adresse)
    U->>F: Étape 2 — Infos projet (titre, secteur, type étude, délai)
    U->>F: Étape 3 — Budget (lignes: désignation, qté, PU)
    F->>API: POST /api/generate {step1, step2}
    API->>Claude: Prompt FR structuré BTH Expert style
    Claude-->>API: {contexte, objectifs, hypothèses, livrables, ...}
    API-->>F: SoumissionAIContent
    F->>U: Étape 4 — Aperçu éditable (IA + budget)
    U->>F: Édite sections si besoin
    F->>DB: POST /api/soumissions (upsert client + insert soumission + lignes)
    DB-->>F: {soumission_id, numero_offre}
    U->>F: Clic "Exporter DOCX"
    F->>DocAPI: POST /api/export/docx {soumission + editablePreview}
    DocAPI->>DocAPI: buildDocumentData() → generateDocument()
    DocAPI-->>F: Buffer DOCX → download
    U->>F: Clic "Exporter PDF"
    F->>PdfAPI: POST /api/export/pdf {soumission + editablePreview}
    PdfAPI->>DocAPI: generateDocument(forPdf=true)
    PdfAPI->>Cloud: POST DOCX buffer
    Cloud-->>PdfAPI: PDF buffer
    PdfAPI-->>F: Buffer PDF → download
```

---

## Composants React — Référence rapide

| Composant | Rôle | Props clés | Client/Server | Communication |
|-----------|------|-----------|---------------|---------------|
| `Sidebar` | Navigation principale filtrée par rôle | `role`, `pathname` | Client (animations, pathname) | Lit le profil depuis layout |
| `Header` | Barre top — user dropdown, alertes, déconnexion | `user`, `alertsCount` | Client (onClick, dropdown) | Fetch `/api/prospects/alerts` |
| `BottomNav` | Navigation mobile — miroir Sidebar | `role` | Client (pathname) | — |
| `LoginForm` | Formulaire email/password Supabase | — | Client (form state) | `supabase-browser.ts` signIn |
| `HashTokenRedirect` | Extrait token Supabase depuis URL hash | — | Client (window.location) | Supabase session |
| `StepClientInfo` | Étape 1 wizard — données client | `data`, `onChange` | Client (form) | État remonté au wizard parent |
| `StepProjectInfo` | Étape 2 wizard — données projet | `data`, `onChange` | Client (form) | État remonté au wizard parent |
| `StepBudget` | Étape 3 wizard — lignes budget | `lignes`, `onChange` | Client (drag/sort) | État remonté + `calcTotaux()` |
| `StepPreview` | Étape 4 wizard — aperçu IA éditable | `preview`, `soumission` | Client (édition inline) | `POST /api/generate`, `POST /api/soumissions` |
| `EditableSection` | Bloc texte éditable en place | `value`, `onChange`, `label` | Client (textarea focus) | Callback onChange vers StepPreview |
| `ProspectCard` | Carte prospect dans le pipeline | `prospect` | Probablement Server | Lien vers `/prospection/[id]` |
| `VisiteForm` | Formulaire log de visite | `prospectId`, `onSuccess` | Client (form submit) | `POST /api/visites` |
| `PlanningZone` | Zone planification prochaine action | `prospect` | Client (interactions) | `PATCH /api/prospects/[id]` |

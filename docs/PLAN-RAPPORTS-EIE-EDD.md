# Plan d'implémentation — Module « Rapports EIE / EDD »

> Le module phare : générateur de rapports environnementaux longs (30–40 pages).
> EIE = Étude d'Impact sur l'Environnement · EDD = Étude De Dangers.
> Architecture **jurisdiction-agnostique** : Algérie (décret 07-145) ET Canada (PÉEIE / AÉIC).
> Statut : spec de conception — daté du 2026-06-05.

---

## ⚠️ À lire en premier

C'est **le défi technique majeur** de BTH Hub. Un rapport de 30–40 pages avec
données techniques difficiles **n'est PAS un prompt « génère un rapport »**. La
qualité « bureau d'études » repose sur **l'ingénierie anti-hallucination**, pas sur
la puissance brute du modèle.

Deux règles non négociables :
1. **L'IA ne fabrique JAMAIS de données chiffrées.** Les mesures (émissions, qualité
   air/eau/sol, bruit, biodiversité) viennent de saisies/imports structurés. L'IA
   rédige *autour* des données, jamais à leur place.
2. **Validation humaine obligatoire, section par section.** L'outil produit un
   brouillon expert ; le chargé de projet valide et engage sa signature.

Prérequis stratégique : ce module est l'**up-sell** après la lettre d'assujettissement
(voir `PLAN-LETTRE-ASSUJETTISSEMENT.md`). On le lance une fois la confiance client
et les revenus établis.

---

## 1. Pourquoi c'est difficile (et où est le risque)

| Difficulté | Conséquence si mal gérée | Parade |
|---|---|---|
| Longueur (40 pages) | dérive, perte de structure, incohérences | pipeline **section par section**, pas one-shot |
| Données chiffrées | hallucination de mesures = faute professionnelle | **séparation données / rédaction** stricte |
| Structure réglementaire imposée | rapport non conforme = rejeté | **squelette piloté par template réglementaire** |
| Cohérence inter-sections | contradictions entre §3 et §7 | **état partagé** + relecture de cohérence |
| Qualité « expert » | texte générique « ChatGPT » | **RAG** sur rapports passés + réglementation |
| Tableaux / figures | mise en page cassée | données structurées → gabarits dédiés |

---

## 2. Architecture du pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│ 0. CONFIG RÉGLEMENTAIRE                                            │
│    structure de rapport imposée par juridiction (sections, ordre) │
│    → "template de plan" versionné (Algérie 07-145 / Canada PÉEIE)  │
└────────────────────────────┬─────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 1. INTAKE PROJET + DONNÉES                                        │
│    a) caractéristiques projet (formulaire structuré)              │
│    b) données techniques (saisie + import Excel/CSV)              │
│       → émissions, mesures, inventaires faune/flore, etc.         │
│    c) documents sources (uploads : études terrain, plans)         │
└────────────────────────────┬─────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. INDEXATION RAG (par organisation, isolé)                       │
│    - rapports EIE/EDD passés du bureau                            │
│    - textes réglementaires + normes                              │
│    → base vectorielle cloisonnée par tenant                      │
└────────────────────────────┬─────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. ORCHESTRATEUR DE SECTIONS                                      │
│    pour chaque section du plan :                                  │
│      • assemble le contexte (intake + données + RAG pertinent)    │
│      • appelle un "agent de section" spécialisé                   │
│      • passe l'état partagé (résumés des sections précédentes)    │
│      • extended thinking pour les sections analytiques            │
└────────────────────────────┬─────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. ASSEMBLAGE + DONNÉES STRUCTURÉES                              │
│    - prose IA + tableaux générés depuis les données (pas l'IA)   │
│    - figures/cartes insérées depuis les uploads                  │
└────────────────────────────┬─────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. RELECTURE DE COHÉRENCE (passe globale)                        │
│    - détecte contradictions inter-sections                       │
│    - vérifie que chaque donnée citée existe dans l'intake        │
└────────────────────────────┬─────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 6. VALIDATION HUMAINE section par section                         │
│    réutilise StepPreview / EditableSection                       │
└────────────────────────────┬─────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 7. EXPORT (docxtemplater → microservice LibreOffice Render)      │
│    table des matières, pagination, en-têtes, annexes             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Le principe central : séparer DONNÉES et RÉDACTION

C'est ce qui distingue un outil « bureau d'études » d'un générateur de texte.

| Type de contenu | Source | Qui le produit |
|---|---|---|
| Mesures, seuils, tableaux chiffrés | intake / import Excel | **moteur (jamais l'IA)** |
| Inventaires faune/flore, quantités | saisie structurée | **moteur** |
| Cartes, plans, photos | uploads | inséré tel quel |
| Analyse d'impact, contexte, rédaction | RAG + données | **IA, grounded** |
| Conclusions réglementaires | règles + données | moteur + IA encadrée |

> L'IA reçoit les données déjà calculées et **doit les citer telles quelles**. Tout
> chiffre dans la prose est tracé à une entrée de données → vérifiable
> automatiquement (passe §5).

---

## 4. Conception du RAG (cloisonné par tenant)

```
table rag_documents
  id, organisation_id (fk),         -- isolation tenant
  type ('rapport_passe'|'reglementation'|'norme'|'guide'),
  juridiction, titre, source, version, fichier_url

table rag_chunks
  id, document_id (fk), organisation_id,
  contenu, embedding (vector),       -- pgvector sur Supabase
  metadata (jsonb)                   -- section, page, type
```

Points clés :
- **pgvector** (extension Supabase Postgres) → pas d'infra externe.
- **RLS par `organisation_id`** : le corpus d'un bureau n'est JAMAIS visible d'un
  autre. C'est ce qui permet de vendre à plusieurs bureaux sans homogénéiser ni
  fuiter (cf. discussion stratégique).
- Le **socle réglementaire commun** (lois, normes — public) peut être partagé en
  lecture entre tenants ; le **corpus privé** (rapports passés) reste cloisonné.
- Récupération par section : on n'injecte que les chunks pertinents pour la section
  en cours → contexte ciblé, coût IA maîtrisé.

---

## 5. Orchestration des sections

```
table rapports
  id, organisation_id, type ('EIE'|'EDD'), juridiction,
  projet_intake (jsonb), donnees_techniques (jsonb),
  plan_version,                      -- version du template réglementaire
  statut, cree_par, valide_par, timestamps

table rapport_sections
  id, rapport_id (fk), ordre, code_section, titre,
  contexte_utilise (jsonb),          -- traçabilité : quoi a servi
  contenu_genere, contenu_edite,     -- brouillon IA vs version validée
  donnees_citees (jsonb),            -- chiffres référencés (pour vérif)
  statut ('a_generer'|'genere'|'en_revue'|'valide'),
  cout_tokens, modele_utilise
```

**État partagé inter-sections** : chaque section reçoit un résumé condensé des
sections déjà validées (pas le texte brut entier) → cohérence sans exploser le
contexte. C'est l'orchestrateur qui maintient ce résumé glissant.

**Agents de section spécialisés** : selon le type de section, prompt + outils
différents :
- *Descriptif* (description du projet, état initial) → factuel, structuré.
- *Analytique* (évaluation des impacts) → extended thinking, raisonnement.
- *Réglementaire* (mesures d'atténuation, PGE/PGES) → grounded sur règles + normes.

---

## 6. Garde-fous qualité (anti-hallucination sur 40 pages)

1. **Vérification de groundedness automatique** : chaque chiffre de la prose doit
   matcher une entrée de `donnees_techniques`. Sinon → flag rouge à l'expert.
2. **Passe de cohérence globale** (§5 du pipeline) : détecte contradictions entre
   sections (ex. surface du site différente en §2 et §6).
3. **Citations RAG** : les affirmations réglementaires renvoient à la source indexée.
4. **Validation humaine bloquante** : export impossible tant que toutes les sections
   ne sont pas au statut `valide`.
5. **Versionnement** : plan réglementaire + corpus RAG versionnés → régénération
   reproductible et auditable.
6. **Génération incrémentale** : une section peut être régénérée seule sans refaire
   tout le rapport (réutilise le pattern `RegenerateModal` existant).

---

## 7. Réutilisation de l'existant

| Brique existante | Réutilisée pour |
|---|---|
| Wizard `components/forms/` | intake projet + données |
| `lib/excel-utils.ts` / `xlsx` | import des données techniques |
| `StepPreview` + `EditableSection` | validation section par section |
| `RegenerateModal` | régénération d'une section isolée |
| `lib/anthropic.ts` + `sanitize-ai-text.ts` | agents de rédaction |
| `lib/generate-document.ts` (docxtemplater) | assemblage DOCX long |
| Microservice LibreOffice (Render) | PDF + pagination/TOC |
| Supabase + RLS | persistance + isolation tenant |

→ Le plus dur de l'infra (génération doc, conversion PDF, formulaires, édition) est
**déjà là**. Le nouveau, c'est : RAG, orchestrateur, agents de section, garde-fous.

---

## 8. Découpage en lots

| Lot | Contenu | Effort | Dépend de |
|---|---|---|---|
| **L0 — Cadrage** | Plans réglementaires EIE & EDD par juridiction ; recueil d'exemples de rapports ; définition des données techniques par type de projet | **L** | — |
| **L1 — Modèle données** | Schémas `rapports`, `sections`, `donnees_techniques` + RLS tenant | M | L0 |
| **L2 — Intake + import** | Formulaire projet + import Excel des données techniques | M | L1 |
| **L3 — RAG** | pgvector, ingestion, chunking, récupération par section | **L** | L1 |
| **L4 — Orchestrateur** | Boucle de sections, état partagé, agents spécialisés | **L** | L2, L3 |
| **L5 — Garde-fous** | Vérif groundedness + passe de cohérence globale | M | L4 |
| **L6 — Validation UI** | Revue section par section (réutilise existant) | M | L4 |
| **L7 — Export long** | Template DOCX 40p, TOC, en-têtes, annexes, tableaux | **L** | L4 |
| **L8 — Versionnement** | Versions plan + corpus, régénération reproductible | S | L1 |

**Effort global estimé : 25–45 jours-homme** (sous-projet à part entière).
**Ordre** : L0 (bloquant, non technique) → L1 → L2 → L3 → L4 → L5/L6/L7 → L8.

---

## 9. Différences EIE vs EDD

Même moteur, **plans et données différents** :

| | EIE (impact environnemental) | EDD (étude de dangers) |
|---|---|---|
| Focus | impacts sur milieux (air, eau, sol, faune…) | risques accidentels, scénarios, sécurité |
| Données clés | mesures environnementales, inventaires | scénarios d'accident, modélisation effets |
| Sections types | état initial, impacts, mesures, PGES | identification dangers, analyse risques, MMR |
| Particularité | fort volet biodiversité/milieux | modélisation quantitative (effets thermiques, surpression…) |

→ Le plan réglementaire (L0) est **paramétré par type** ; le moteur est commun.

---

## 10. Coût indicatif (marché Montréal, rappel)

| | Estimation |
|---|---|
| Charge | 25–45 jours-homme |
| Freelance senior | ≈ 20 000 – 50 000 $ CAD |
| Agence | ≈ 50 000 – 90 000 $ CAD |

Coût récurrent additionnel : embeddings + génération IA par rapport (quelques $ à
quelques dizaines de $ par rapport selon longueur).

---

## 11. Décisions ouvertes

- [ ] Juridiction prioritaire pour le **premier** plan réglementaire (Algérie BTH vs Canada).
- [ ] Types de projets couverts en priorité (carrière ? STEP ? industrie ?) → définit les données techniques.
- [ ] Modélisation quantitative EDD : intégrée ou import externe ?
- [ ] Niveau d'automatisation des cartes/figures (manuel vs génération).
- [ ] Choix du modèle d'embeddings (et hébergement données au Canada si requis).

---

## 12. Prochaine action

Le lot **L0** est bloquant et **non technique** : il faut les **plans réglementaires
réels** et des **exemples de rapports** pour entraîner le RAG et calibrer les agents.
Deux pistes :
1. `/deep-research` pour le squelette réglementaire EIE/EDD par juridiction.
2. Fournir 3–5 anciens rapports BTH (anonymisés) comme corpus de référence initial.

Le développement démarre ensuite par L1 (données) + L3 (RAG) en parallèle.

# Plan d'implémentation — Module « Lettre d'assujettissement »

> Premier produit vendable du virage SaaS de BTH Hub.
> Cible réglementaire : **Canada fédéral (AÉIC)** + **Québec (LQE / PÉEIE)**.
> Statut : spec de conception — daté du 2026-06-05.

---

## ⚠️ Avertissement réglementaire (à lire en premier)

Ce document décrit **l'architecture logicielle**, pas le contenu juridique faisant
autorité. Les **seuils, catégories et articles** cités ci-dessous sont des
**hypothèses de travail** issues de connaissances générales **non vérifiées en
direct**. Avant tout déploiement client :

1. Faire **valider chaque règle** par un expert (chargé de projet / juriste environnement).
2. Sourcer chaque seuil sur le texte officiel (voir « Sources à vérifier » en fin de doc).
3. **Le moteur ne doit jamais coder les règles en dur** — elles vivent dans une base
   de données versionnée, éditable par un expert sans toucher au code (voir §4).

Principe directeur : **l'outil produit un BROUILLON que l'expert valide et signe.**
Jamais un document final autonome. (Responsabilité professionnelle OIQ au Québec.)

---

## 1. Pourquoi ce module en premier (le « wedge »)

| Critère | EIE/EDD complet | **Lettre d'assujettissement** |
|---|---|---|
| Longueur livrable | 30–40 pages | quelques pages |
| Nature | rédaction experte + données terrain | **analyse de règles (seuils/catégories)** |
| Risque d'hallucination IA | élevé | **faible** (logique déterministe) |
| Données d'entrée | lourdes (mesures terrain) | **légères** (caractéristiques projet) |
| Valeur facturée par les bureaux | énorme mais long | **~200 h** pour un livrable court |
| Faisabilité technique | difficile | **élevée** |

→ Ratio valeur/risque optimal pour valider le marché québécois, puis up-seller l'EIE.

---

## 2. Définition fonctionnelle

**Entrée** : caractéristiques structurées d'un projet (type, capacité/seuils,
localisation, milieux sensibles touchés, etc.).

**Traitement** : confrontation des caractéristiques aux grilles réglementaires de
chaque juridiction → conclusion **assujetti / non assujetti / à clarifier**, avec
justification traçable (article + seuil déclencheur).

**Sortie** : une lettre d'analyse d'assujettissement (DOCX/PDF) citant les
dispositions applicables, avec la conclusion et les prochaines étapes.

### Les deux cadres visés

| Cadre | Texte de référence (à vérifier) | Mécanisme d'assujettissement |
|---|---|---|
| **Fédéral** | *Loi sur l'évaluation d'impact* (2019) + **Règlement sur les activités concrètes** (« liste des projets désignés ») | Le projet figure-t-il dans la liste désignée + seuils ? |
| **Québec** | *LQE* + **Règlement relatif à l'évaluation et l'examen des impacts** (annexes) ; autorisation art. 22 LQE | Le projet est-il à l'annexe des projets assujettis à la PÉEIE ? |

> Un même projet peut être assujetti **au fédéral, au provincial, aux deux, ou à
> aucun**. Le moteur évalue **chaque juridiction indépendamment** et produit une
> conclusion par cadre + une synthèse.

---

## 3. Architecture — séparer la RÈGLE de la RÉDACTION

C'est le cœur de la fiabilité. Trois couches strictement séparées :

```
┌─────────────────────────────────────────────────────────────┐
│  1. INTAKE (formulaire structuré)                            │
│     → caractéristiques projet normalisées (typées, validées) │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  2. MOTEUR DE RÈGLES (déterministe, 0 IA)                    │
│     → évalue les rulesets fédéral + Québec                   │
│     → sortie structurée : findings + citations + conclusion  │
│     → 100 % traçable et reproductible                        │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  3. RÉDACTION IA (Claude) — GROUNDED sur la sortie §2 only   │
│     → met en prose les findings, n'invente AUCUN seuil       │
│     → ton professionnel, structure de lettre                 │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  4. VALIDATION HUMAINE (réutilise EditableSection/StepPreview)│
│     → l'expert relit, édite, valide chaque section            │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  5. EXPORT (docxtemplater → microservice LibreOffice Render) │
└─────────────────────────────────────────────────────────────┘
```

**Pourquoi cette séparation est non négociable :**
- Le **moteur de règles** garantit qu'aucun seuil n'est halluciné : c'est du code
  déterministe + données, pas de l'IA.
- L'**IA ne fait que rédiger** à partir de faits déjà établis → risque d'erreur
  juridique quasi nul.
- Chaque conclusion est **traçable** jusqu'à l'article de loi → défendable devant
  un client / un ordre professionnel.

### Réutilisation de l'existant (gros accélérateur)

| Brique existante | Réutilisée pour |
|---|---|
| Formulaire multi-étapes (`components/forms/`) | l'intake projet |
| `StepPreview` + `EditableSection` | la validation humaine section par section |
| `lib/generate-document.ts` (docxtemplater) | l'assemblage DOCX |
| Microservice LibreOffice (Render) | la conversion PDF |
| `lib/anthropic.ts` + `sanitize-ai-text.ts` | la couche rédaction IA |
| `lib/schemas/` (Zod) | la validation de l'intake |
| Supabase + RLS | persistance + isolation par organisation |

---

## 4. Modèle de données

### 4.1 Le ruleset (versionné, éditable par un expert)

Les règles ne sont **pas** dans le code. Elles vivent en base, versionnées :

```
table reglementations
  id, juridiction ('federal' | 'quebec'), version, date_effet,
  statut ('brouillon' | 'active' | 'archivee'), source_url, note

table regles_assujettissement
  id, reglementation_id (fk),
  code,                      -- ex. "FED-PROJ-12", "QC-ANX1-03"
  libelle,                   -- description lisible
  categorie_projet,          -- ex. "carrière", "traitement eaux usées"
  conditions (jsonb),        -- arbre de conditions (voir §4.2)
  consequence ('assujetti' | 'non_assujetti' | 'a_clarifier'),
  article_reference,         -- ex. "Annexe 1, art. 3"
  citation_texte             -- extrait à citer dans la lettre
```

> Versionner les rulesets permet : (a) de régénérer une vieille lettre à
> l'identique, (b) d'auditer quelle version de la loi a servi, (c) de mettre à jour
> la réglementation sans redéploiement.

### 4.2 Format des conditions (table de décision)

Conditions exprimées en JSON évaluable, pas en code :

```json
{
  "all": [
    { "champ": "type_projet", "op": "in", "val": ["carriere", "mine"] },
    { "champ": "capacite_tonnes_an", "op": ">=", "val": 500000 },
    { "any": [
      { "champ": "zone_humide_touchee", "op": "==", "val": true },
      { "champ": "distance_cours_eau_m", "op": "<", "val": 100 }
    ]}
  ]
}
```

Un évaluateur générique (`lib/rules/evaluate.ts`) parcourt l'arbre → pas de logique
métier figée dans le code applicatif.

### 4.3 Les dossiers d'analyse

```
table lettres_assujettissement
  id, organisation_id (fk),  -- multi-tenant
  projet_nom, projet_intake (jsonb),   -- réponses du formulaire
  resultats (jsonb),         -- sortie du moteur de règles
  contenu_redige (jsonb),    -- sections rédigées par l'IA, éditées
  conclusion_federal, conclusion_quebec,
  reglementation_versions (jsonb),  -- versions de rulesets utilisées
  statut ('brouillon'|'en_revue'|'valide'|'exporte'),
  cree_par, valide_par, created_at, updated_at
```

> RLS par `organisation_id` (extension du pattern RLS existant) → cloisonnement
> total entre bureaux clients. Aucun corpus ne fuit entre tenants.

---

## 5. Découpage en lots (jalons livrables)

| Lot | Contenu | Effort | Dépend de |
|---|---|---|---|
| **L0 — Cadrage réglementaire** | Recueil + validation des règles fédérales & QC avec un expert ; remplissage des rulesets | M | — |
| **L1 — Moteur de règles** | Évaluateur déterministe + tests unitaires exhaustifs sur les conditions | M | L0 |
| **L2 — Intake** | Formulaire projet (réutilise le wizard) + schémas Zod | S | — |
| **L3 — Couche rédaction IA** | Prompts grounded, sanitation, génération section par section | M | L1 |
| **L4 — Validation humaine** | Réutilise `StepPreview`/`EditableSection` pour la revue | S | L3 |
| **L5 — Export** | Template DOCX dédié + branchement LibreOffice | S | L4 |
| **L6 — Multi-tenant** | `organisation_id`, RLS, gestion des accès par bureau | M | — |
| **L7 — Versionnement & audit** | Versions de rulesets, traçabilité, régénération | S | L1 |

**Ordre recommandé** : L0 → L2 → L1 → L3 → L4 → L5, puis L6/L7 avant
commercialisation. L0 est bloquant et **non technique** : c'est le travail d'expert.

---

## 6. Qualité & garde-fous (anti-hallucination)

1. **Aucun chiffre/seuil dans les prompts IA** : l'IA reçoit uniquement les
   `findings` déjà calculés par le moteur. Elle rédige, ne décide pas.
2. **Citations obligatoires** : chaque affirmation d'assujettissement renvoie à un
   `article_reference` issu du ruleset.
3. **Cas « à clarifier »** explicite : si les conditions ne tranchent pas, le moteur
   ne devine pas — il signale un point à arbitrer par l'expert.
4. **Validation humaine obligatoire** avant export (statut `valide` requis).
5. **Tests unitaires** sur l'évaluateur de règles (table de cas : projet → conclusion attendue).
6. **Mention de version** réglementaire imprimée sur la lettre.

---

## 7. Décisions ouvertes (à trancher avec toi / ton ami expert)

- [ ] Terme et procédure **exacts** au fédéral vs Québec (sont-ce deux lettres distinctes ?).
- [ ] Part réellement automatisable des ~200 h facturées (analyse vs collecte terrain).
- [ ] Niveau de signature/responsabilité engagé (OIQ) → impact sur le workflow de validation.
- [ ] Hébergement des données **au Canada** requis par les clients ? (région Supabase/Render).
- [ ] Modèle de tarification SaaS (par siège ? par lettre ? abonnement bureau ?).

---

## 8. Sources officielles à vérifier (L0)

> À confirmer via `/deep-research` ou consultation directe — **ne pas se fier aux
> seuils de ce doc sans vérification**.

- Loi sur l'évaluation d'impact (fédéral, 2019) + Règlement sur les activités concrètes.
- Loi sur la qualité de l'environnement (Québec) + Règlement relatif à l'évaluation
  et l'examen des impacts sur l'environnement de certains projets (annexes).
- Cadre de l'autorisation ministérielle (art. 22 LQE).
- Encadrement professionnel (Ordre des ingénieurs du Québec) pour la signature.

---

## 9. Prochaine action

Le lot **L0 (cadrage réglementaire)** est le point de départ et ne nécessite pas de
code. Deux pistes possibles :
1. Lancer `/deep-research` pour produire un dossier réglementaire sourcé (fédéral + QC).
2. Atelier avec ton ami chargé de projet pour cartographier la grille de décision réelle.

Une fois les règles validées, le développement démarre par L2 (intake) + L1 (moteur).

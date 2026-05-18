# BTH Hub — CRM de gestion des offres BTH Expert

## Comportement obligatoire (Karpathy Guidelines)

**Avant de coder :** State tes assumptions. Si ambigu, présente les interprétations, ne choisis pas silencieusement. Si une approche plus simple existe, dis-le. Si confus → **stop et demande**.

**Simplicité d'abord :** Code minimum qui résout le problème. Zéro feature non demandée, zéro abstraction pour usage unique, zéro "flexibilité" non requise.

**Changements chirurgicaux :** Touche uniquement ce qui est nécessaire. Ne "améliore" pas le code adjacent. Match le style existant. Si dead code non lié détecté → mentionne-le, ne supprime pas.

**Exécution orientée objectif :** Transforme chaque tâche en critère vérifiable. Multi-étapes → plan court avant d'agir. `npm run build` = 0 erreurs avant de passer à la suite.

**Une tâche à la fois. Un commit par tâche. Lire le fichier avant de le modifier.**

---

## Skills — Utilisation obligatoire

> Ces skills sont installés et doivent être utilisés systématiquement selon le contexte.
> Ne pas les ignorer — ils définissent le niveau de qualité attendu sur ce projet.

**`superpowers`** — À activer pour toute feature complexe touchant plus de 3 fichiers.
Laisse-le décomposer la tâche en sous-agents spécialisés. Ne pas essayer de tout faire en un seul contexte.

**`frontend-design`** — Obligatoire pour tout composant UI, page, dashboard, formulaire.
Ce projet exige un niveau UI/UX Pro Max. Chaque écran doit être soigné, animé (Framer Motion), et mobile-first.

**`/ui-ux-pro-max`** — Combiné avec `frontend-design` pour les écrans principaux.
Utilise les 67 styles et 96 palettes disponibles. Ne jamais livrer un composant visuellement générique.

**`/codereview`** — Obligatoire avant chaque commit.
Passe le diff en review avant de proposer le message de commit. Signale tout ce qui dévie des conventions du projet.

**`/security`** — Obligatoire pour tout code touchant : auth, RLS, API routes, variables d'environnement, cookies, tokens.
Une faille de sécurité sur ce projet = données clients exposées.

**`bth-document-style`** — Obligatoire pour toute génération ou correction de document officiel BTH Expert (soumissions DOCX/PDF).

> ⚠️ Après toute génération via frontend-design ou /ui-ux-pro-max :
> remplacer systématiquement les couleurs générées par les tokens --bth-*,
> Inter/Roboto par Space Grotesk, et tout gris froid par les warm neutrals bth-n-*.

---

## Stack

- Next.js App Router + TypeScript strict (jamais de `any`)
- Tailwind CSS v4 + Framer Motion — animations systématiques, **mobile-first obligatoire** (min 44px touch targets)
- Supabase @supabase/ssr (Paris eu-west-3)
- API Anthropic `claude-sonnet-4-5`
- docxtemplater + pizzip → `lib/generate-document.ts`
- Cloudmersive API → `lib/convert-to-pdf.ts`

---

## Design System — LIRE AVANT TOUT COMPOSANT UI

> Source de vérité : **`DESIGN.md`** (à la racine du projet)
> Tokens CSS : **`app/globals.css`** — bloc `@theme` préfixe `--color-bth-*`

### Règles non-négociables

**Couleurs**
- Nouveaux composants → toujours `bg-bth-green-800`, `text-bth-n-900`, etc. (classes générées par @theme)
- Composants existants → peuvent garder `bg-primary` pour la compatibilité
- Jamais de couleur hardcodée (`#1a2e1e`) — utiliser les tokens
- Jamais de gris froid (`#f8f8f8`, `#e0e0e0`, `gray-100`) — toujours warm neutral (`bth-n-*`)
- Gold `bth-gold-500` scarce : max 8 usages par page

**Typographie**
- Font UI : Space Grotesk partout dans le Hub
- Font display/editorial : Playfair Display (titres de page seulement)
- Font body dense : Lora (aperçus de soumission seulement)
- Jamais Inter, Roboto, ou system-ui par défaut

**Montants DZD — règle absolue**
```tsx
// TOUJOURS sur les cellules de montant
<td className="tnum text-right font-medium">
  {formatMontant(montant)}
</td>
// OU via classe utilitaire globale : className="tnum"
// OU via CSS : font-feature-settings: "tnum"; letter-spacing: -0.42px;
```

**Boutons Hub**
- `border-radius: 8px` (--radius-bth-md) — jamais pill (9999px) dans le Hub
- 1 seul bouton Primary par zone/section
- Press state : `transform: scale(0.97)` — toujours

**Animations**
- Jamais de gradient animé, float infini, pulse-glow
- Jamais `transition: all` — nommer la propriété explicitement
- Modal enter : `scale(0.95) translateY(16px) → scale(1)`, 400ms ease-spring
- Hover card : `translateY(-2px)`, 250ms ease-out

**Focus & Accessibilité**
- Focus ring sur TOUS les éléments interactifs : classe `bth-focus` ou outline manuel
- Touch targets minimum 44×44px

### Surfaces Hub (hiérarchie à respecter)
```
canvas (#faf8f5) → surface-1 (#fff) → surface-2 (#f5f0e8) → surface-3 (#e8e2d8)
Ne jamais sauter un niveau.
```

---

## Conventions critiques

- UI : **BTH Hub** | Documents officiels : **BTH Expert**
- Montants : `100\u00A0000,00` via `formatMontant()` dans `lib/utils.ts` + classe `tnum`
- API routes : toujours `createServerClient` + `cookies()` — jamais le client anon (RLS 42501)
- Policies RLS : `WITH CHECK` obligatoire en plus de `USING` pour les inserts
- Clés API : uniquement `.env.local`, jamais dans le code

---

## Architecture documents

- Template : `templates/template-standard.docx` (variables `{xxx}`, boucle `{#lignes_budget}`)
- Référence visuelle : `ODS_AT_PHARMAPhase_II.pdf`
- **NE PAS utiliser** jsPDF, `lib/generate-pdf.ts`, `lib/generate-docx.ts`
- Détail variables template → voir `PROGRESS.md`

---

## Système de rôles RBAC — en cours d'implémentation

| Rôle | Accès |
|------|-------|
| `admin` | Tout |
| `charge_projet` | Soumissions + clients |
| `commercial` | Module Prospection uniquement |

Champ `role` (enum) dans table `profiles`. Middleware lit le rôle. API routes vérifient côté serveur.

---

## Schémas — Module Prospection (tables à créer)

**`prospects`** : id, entreprise, secteur_activite (texte libre), nom_contact, poste_contact, telephone, email, adresse (complète — pas de wilaya séparée), notes_generales, statut_global (`actif`|`sans_suite`|`converti`), created_by (FK profiles), created_at, updated_at

**`visites`** : id, prospect_id (FK→prospects CASCADE), date_visite, resultat (`soumission_demandee`|`rappel_planifie`|`pas_interesse`|`absent`|`autre`), notes_visite, date_prochaine_action, action_requise, commercial_id (FK profiles), created_at

RLS : commercial voit uniquement ses propres entrées — admin voit tout.

---

## Fichiers à ne jamais modifier sans permission explicite

`templates/template-standard.docx` · `lib/anthropic.ts` · `middleware.ts` · `lib/supabase-browser.ts` · `lib/supabase-server.ts` · `.env.local` · `DESIGN.md` (modifier uniquement si évolution du design system validée)

---

## Bugs corrigés — ne pas réintroduire

- `generateNumeroOffre()` → `useState()` au niveau composant, jamais dans `handleExport()`
- API routes → `createServerClient` + `cookies()`, jamais `lib/supabase.ts` (client anon)
- Policies RLS → `WITH CHECK` obligatoire pour les inserts

---

## Commandes

```bash
npm run dev      # localhost:3000
npm run build    # 0 erreurs obligatoires avant tout commit
```
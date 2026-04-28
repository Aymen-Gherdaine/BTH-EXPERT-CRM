# BTH Hub — Progression

## État actuel : 🔧 Migration docxtemplater en cours

---

## ✅ TERMINÉ

### Infrastructure
- Next.js 16.2.4, Tailwind v4, Framer Motion, TypeScript
- Supabase (Paris), RLS activé, tables créées + policies exécutées
- Auth Supabase complète : login, invitation, set-password, middleware
- Rebranding BTH Hub + couleurs `#1a2e1e`
- netlify.toml configuré

### Pages & Composants
- Dashboard (stats vides pour l'instant)
- Soumissions : liste + nouvelle (formulaire 4 étapes) + [id]
- Clients
- Profil (avatar, nom, password)
- Paramètres (société, signataires, TVA, délais, signatures uploadables)
- Sidebar + Header avec dropdown user

### API Routes
- `/api/generate` — génération IA Anthropic
- `/api/export/docx` et `/api/export/pdf` — à refactorer
- `/api/soumissions`, `/api/clients`, `/api/dashboard`

---

## 🔧 EN COURS — Migration génération documents

### Décision architecturale
**Abandon jsPDF + generate-docx.ts → docxtemplater + template Word**
Raison : impossible d'atteindre la fidélité visuelle au modèle SAFMA avec jsPDF.

### Template préparé ✅
- `templates/template-standard.docx` — créé à partir de `Soumission_Sarl SAFMA.docx`
- Toutes les variables `{xxx}` insérées (35+ variables)
- Boucle dynamique budget `{#lignes_budget}...{/lignes_budget}`
- Typo "BTH EXEPRT" → "BTH EXPERT" corrigée dans les footers
- Tableau récap : Total HT / TVA `{tva_pct}%` / Total TTC

### À faire maintenant (dans l'ordre)
- [ ] `npm install docxtemplater pizzip`
- [ ] Créer `lib/generate-document.ts` (docxtemplater + helper `nombreEnLettres()`)
- [ ] Créer `lib/convert-to-pdf.ts` (Cloudmersive, `process.env.CLOUDMERSIVE_API_KEY`)
- [ ] Refactorer `app/api/export/docx/route.ts`
- [ ] Refactorer `app/api/export/pdf/route.ts`
- [ ] Supprimer `lib/generate-pdf.ts` et `lib/generate-docx.ts`
- [ ] Test complet : générer une soumission SAFMA, vérifier fidélité visuelle

---

## 📋 RESTE À FAIRE

### Priorité haute
- [ ] Clé Cloudmersive : créer compte sur cloudmersive.com (gratuit, 1000/mois), ajouter `CLOUDMERSIVE_API_KEY` dans `.env.local`
- [ ] Dashboard — brancher vraies stats Supabase
- [ ] Brancher paramètres sur les exports (fetcher table `parametres` dans les routes API)

### Priorité moyenne
- [ ] Vérifier UX complète soumissions (filtres, actions : voir/modifier/dupliquer/supprimer)
- [ ] Vérifier UX clients (liste + historique soumissions)
- [ ] Page édition soumission avant téléchargement (modifier sections IA)
- [ ] Template détaillé (Sonatrach) — en attente d'un exemple de ton ami

### Déploiement
- [ ] Variables Netlify : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, `CLOUDMERSIVE_API_KEY`
- [ ] Supabase Redirect URLs : ajouter `https://bth-hub.netlify.app/auth/callback`
- [ ] Push GitHub + déploiement Netlify

---

## Fichiers sensibles — NE PAS MODIFIER
- `templates/template-standard.docx` — template maître
- `lib/anthropic.ts` — system prompt IA
- `lib/supabase-browser.ts` / `lib/supabase-server.ts`
- `middleware.ts`
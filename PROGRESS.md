# BTH Expert CRM — Avancement du projet

## ✅ Fait

### Authentification & Flow d'invitation Supabase
- [x] `middleware.ts` — protection des routes, routes publiques (`/login`, `/auth/callback`, `/auth/set-password`)
- [x] `app/auth/callback/route.ts` — intercepte le token Supabase (PKCE), échange contre une session, redirige selon le `type` (invite → set-password, sinon → dashboard)
- [x] `components/auth/HashTokenRedirect.tsx` — bridge pour le flow implicite (hash tokens) : détecte `#access_token` dans l'URL, appelle `setSession()`, redirige vers set-password
- [x] `app/(auth)/login/page.tsx` — inclut `HashTokenRedirect` + design BTH Hub (`#1a2e1e`)
- [x] `components/auth/LoginForm.tsx` — logo BTH Hub centré, couleurs `#1a2e1e`, champs avec `autoComplete`
- [x] `app/auth/set-password/page.tsx` — formulaire définition mot de passe, icône œil afficher/masquer, validation 8 caractères, bouton "Confirmer et accéder"

> **Config Supabase à faire manuellement :**
> - Authentication → URL Configuration → Redirect URLs : ajouter `http://localhost:3000/auth/callback`
> - Authentication → Settings → Auth flow type : passer de **Implicit** à **PKCE**

### Layout & Navigation
- [x] `components/layout/Sidebar.tsx` — logo BTH Expert, navigation (Dashboard / Soumissions / Clients), CTA "Nouvelle soumission" en bas
- [x] `components/layout/Header.tsx` — barre sticky en haut, profil utilisateur à droite (nom + avatar), dropdown (Mon profil / Paramètres / Se déconnecter), skeleton de chargement, `signOut()` → redirect `/login`
- [x] `app/(app)/layout.tsx` — structure : Sidebar (gauche) + colonne droite (Header sticky + main)

---

## 🔲 Reste à faire

### Pages applicatives
- [ ] `/dashboard` — statistiques, KPIs, activité récente (actuellement page vide)
- [ ] `/soumissions` — liste des soumissions avec filtres, statuts, pagination
- [ ] `/soumissions/nouvelle` — formulaire création soumission avec génération IA
- [ ] `/soumissions/[id]` — détail soumission, édition, export PDF/DOCX
- [ ] `/clients` — liste clients, fiche client
- [ ] `/profil` — page profil utilisateur (modifier nom, photo, mot de passe)
- [ ] `/parametres` — paramètres de l'application

### Fonctionnalités métier
- [ ] Génération IA des sections via API Anthropic (`/app/api/generate`)
- [ ] Export PDF via jsPDF (conforme au format Soumission_Sarl SAFMA.pdf)
- [ ] Export DOCX via librairie docx
- [ ] Numérotation automatique des offres (format `T + JJMMAAAA`)
- [ ] Gestion des signataires fixes (Hakim Belghouini + Amine Lahmer)

### Infrastructure
- [ ] Schéma base de données Supabase (tables : soumissions, clients, users)
- [ ] Row Level Security (RLS) sur les tables Supabase
- [ ] Variables d'environnement production (`.env.local` → Vercel/hébergeur)
- [ ] Configuration PKCE Supabase en production (`https://mondomaine.com/auth/callback`)

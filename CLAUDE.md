# BTH Expert CRM

## Stack
- Next.js 16.2 (App Router)
- Tailwind CSS + Framer Motion
- Supabase (PostgreSQL)
- API Anthropic pour génération IA
- Librairie docx + jsPDF pour export

## Conventions
- TypeScript obligatoire
- Composants dans /components
- Pages dans /app
- API routes dans /app/api
- Ne jamais mettre de clés API dans le code
- Variables d'environnement dans .env.local uniquement

## Référence document
- Soumission_Sarl SAFMA.pdf = référence exacte du document à générer
- Sections fixes (jamais générées par IA) : 1.2, 2, 3, 5, 6
- Numéro d'offre auto-généré : T + JJMMAAAA
- Signataires fixes : Hakim Belghouini + Amine Lahmer

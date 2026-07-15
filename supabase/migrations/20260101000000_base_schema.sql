-- ============================================================
-- SCHÉMA DE BASE — baseline versionné (P0)
-- ------------------------------------------------------------
-- Contexte : les tables « socle » (clients, soumissions, lignes_budget,
-- prospects, visites, profiles, parametres) avaient été créées à la main
-- dans le dashboard Supabase et n'existaient dans aucune migration. La base
-- n'était donc pas reproductible : un environnement neuf (staging, CI,
-- nouveau projet Supabase) n'aurait pas eu ces tables, et les migrations RLS
-- plus récentes (qui font ALTER TABLE ... ENABLE ROW LEVEL SECURITY) auraient
-- échoué faute de tables.
--
-- Cette migration porte le timestamp le plus ancien du dossier : sur une base
-- neuve elle s'exécute EN PREMIER et crée les tables avant les migrations RLS.
-- Sur la base EXISTANTE, tout est en CREATE TABLE / ADD COLUMN / CREATE INDEX
-- « IF NOT EXISTS » → strictement NO-OP (rien n'est modifié, aucune donnée
-- touchée). Le schéma reflète l'état réel de la DB (source : types générés
-- Supabase + dérive connue).
--
-- Idempotent. Sans danger à ré-exécuter.
-- ============================================================

-- ── Enum des rôles applicatifs (référencé par profiles.role) ───────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('admin', 'charge_projet', 'commercial');
  END IF;
END $$;

-- ── profiles (1 ligne par utilisateur auth, porte le rôle) ─────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text,
  avatar_url  text,
  role        public.user_role NOT NULL DEFAULT 'commercial',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- ── clients ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre       text NOT NULL CHECK (titre IN ('M.', 'Mme', 'Dr.', 'Pr.')),
  nom_contact text NOT NULL,
  poste       text NOT NULL,
  entreprise  text NOT NULL,
  adresse     text NOT NULL,
  ville       text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- ── soumissions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.soumissions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_offre      text NOT NULL UNIQUE,
  date_offre        date NOT NULL DEFAULT current_date,
  client_id         uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  titre_projet      text NOT NULL,
  secteur_activite  text NOT NULL,
  description_projet text NOT NULL,
  type_etude        text NOT NULL CHECK (type_etude IN ('EIE+Dangers', 'Notice+ProduitsDangereux', 'Audit', 'Autre')),
  delai_jours       integer NOT NULL DEFAULT 45,
  total_ht          numeric(14,2) NOT NULL DEFAULT 0,
  tva               numeric(14,2) NOT NULL DEFAULT 0,
  total_ttc         numeric(14,2) NOT NULL DEFAULT 0,
  statut            text NOT NULL DEFAULT 'Brouillon' CHECK (statut IN ('Brouillon', 'Envoyée', 'Acceptée', 'Refusée')),
  contexte_genere   text,
  versement_recu    numeric(14,2) DEFAULT 0,
  created_at        timestamptz DEFAULT now()
);
-- Dérive : versement_recu (suivi des paiements) a été ajouté après coup.
ALTER TABLE public.soumissions ADD COLUMN IF NOT EXISTS versement_recu numeric(14,2) DEFAULT 0;

-- ── lignes_budget ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lignes_budget (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  soumission_id uuid REFERENCES public.soumissions(id) ON DELETE CASCADE,
  numero        integer NOT NULL,
  designation   text NOT NULL,
  quantite      integer NOT NULL DEFAULT 1,
  prix_unitaire numeric(14,2) NOT NULL DEFAULT 0,
  ordre         integer NOT NULL DEFAULT 0,
  groupe        text NOT NULL DEFAULT 'Mission'
);
-- Dérive : groupe (regroupement de lignes) a été ajouté après coup.
ALTER TABLE public.lignes_budget ADD COLUMN IF NOT EXISTS groupe text NOT NULL DEFAULT 'Mission';

-- ── prospects ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prospects (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise       text NOT NULL,
  secteur_activite text NOT NULL,
  nom_contact      text NOT NULL,
  poste_contact    text NOT NULL,
  telephone        text NOT NULL,
  email            text,
  adresse          text NOT NULL,
  notes_generales  text,
  etape            text NOT NULL DEFAULT 'client_potentiel',
  statut_global    text NOT NULL DEFAULT 'actif',
  raison_perte     text,
  created_by       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- ── visites ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.visites (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id           uuid NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  commercial_id         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  date_visite           date NOT NULL,
  resultat              text NOT NULL,
  notes_visite          text,
  date_prochaine_action date,
  action_requise        text,
  created_at            timestamptz DEFAULT now()
);

-- ── parametres (ligne unique id = 1) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.parametres (
  id                        integer PRIMARY KEY DEFAULT 1,
  nom_societe               text NOT NULL DEFAULT 'BTH Expert',
  adresse                   text NOT NULL DEFAULT '',
  ville                     text NOT NULL DEFAULT '',
  email_contact             text NOT NULL DEFAULT '',
  telephone                 text NOT NULL DEFAULT '',
  site_web                  text DEFAULT '',
  signataire1_nom           text NOT NULL DEFAULT 'Hakim Belghouini',
  signataire1_titre         text NOT NULL DEFAULT 'Expert Co-gérant',
  signataire2_nom           text NOT NULL DEFAULT 'Amine Lahmer',
  signataire2_titre         text NOT NULL DEFAULT 'Expert Gérant',
  tva_pct                   numeric(5,2) NOT NULL DEFAULT 19,
  delai_jours               integer NOT NULL DEFAULT 45,
  validite_jours            integer NOT NULL DEFAULT 30,
  modalites_paiement        text NOT NULL DEFAULT '50% à l''acceptation, 50% à la remise des livrables',
  signature_responsable_url text DEFAULT '',
  signature_autorise_url    text DEFAULT '',
  updated_at                timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO public.parametres (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ── Index (clés étrangères + colonnes filtrées/triées fréquemment) ─────────
CREATE INDEX IF NOT EXISTS idx_soumissions_client   ON public.soumissions(client_id);
CREATE INDEX IF NOT EXISTS idx_soumissions_statut   ON public.soumissions(statut);
CREATE INDEX IF NOT EXISTS idx_soumissions_date     ON public.soumissions(date_offre);
CREATE INDEX IF NOT EXISTS idx_lignes_soumission    ON public.lignes_budget(soumission_id);
CREATE INDEX IF NOT EXISTS idx_visites_prospect     ON public.visites(prospect_id);
CREATE INDEX IF NOT EXISTS idx_visites_commercial   ON public.visites(commercial_id);
CREATE INDEX IF NOT EXISTS idx_prospects_statut     ON public.prospects(statut_global);
CREATE INDEX IF NOT EXISTS idx_prospects_created_by ON public.prospects(created_by);

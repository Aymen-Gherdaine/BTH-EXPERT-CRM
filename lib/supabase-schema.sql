-- BTH Expert CRM - Schéma Supabase
-- Exécuter dans l'éditeur SQL de Supabase

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  titre text not null check (titre in ('M.', 'Mme', 'Dr.', 'Pr.')),
  nom_contact text not null,
  poste text not null,
  entreprise text not null,
  adresse text not null,
  ville text not null,
  created_at timestamptz default now()
);

create table if not exists soumissions (
  id uuid primary key default gen_random_uuid(),
  numero_offre text not null unique,
  date_offre date not null default current_date,
  client_id uuid references clients(id) on delete cascade,
  titre_projet text not null,
  secteur_activite text not null,
  description_projet text not null,
  type_etude text not null check (type_etude in ('EIE+Dangers', 'Notice+ProduitsDangereux', 'Audit', 'Autre')),
  delai_jours integer not null default 45,
  total_ht numeric(14,2) not null default 0,
  tva numeric(14,2) not null default 0,
  total_ttc numeric(14,2) not null default 0,
  statut text not null default 'Brouillon' check (statut in ('Brouillon', 'Envoyée', 'Acceptée', 'Refusée')),
  contexte_genere text,
  created_at timestamptz default now()
);

create table if not exists lignes_budget (
  id uuid primary key default gen_random_uuid(),
  soumission_id uuid references soumissions(id) on delete cascade,
  numero integer not null,
  designation text not null,
  quantite integer not null default 1,
  prix_unitaire numeric(14,2) not null default 0,
  ordre integer not null default 0
);

-- Index utiles
create index if not exists idx_soumissions_client on soumissions(client_id);
create index if not exists idx_soumissions_statut on soumissions(statut);
create index if not exists idx_soumissions_date on soumissions(date_offre);
create index if not exists idx_lignes_soumission on lignes_budget(soumission_id);

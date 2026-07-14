-- BTH Expert CRM — Policies RLS Supabase
-- Exécuter dans l'éditeur SQL de Supabase APRÈS le schéma principal
-- Ces policies autorisent les opérations aux utilisateurs CONNECTÉS
-- uniquement (rôle `authenticated`). L'accès anonyme est exclu :
-- une policy sans `to authenticated` s'appliquerait à PUBLIC/anon,
-- dont la clé est publique. Cf. migration 20260714160000 (SEC-01).

-- =====================
-- TABLE: clients
-- =====================
alter table clients enable row level security;

drop policy if exists "clients_select" on clients;
drop policy if exists "clients_insert" on clients;
drop policy if exists "clients_update" on clients;
drop policy if exists "clients_delete" on clients;

create policy "clients_select" on clients
  for select to authenticated using (true);

create policy "clients_insert" on clients
  for insert to authenticated with check (true);

create policy "clients_update" on clients
  for update to authenticated using (true) with check (true);

create policy "clients_delete" on clients
  for delete to authenticated using (true);

-- =====================
-- TABLE: soumissions
-- =====================
alter table soumissions enable row level security;

drop policy if exists "soumissions_select" on soumissions;
drop policy if exists "soumissions_insert" on soumissions;
drop policy if exists "soumissions_update" on soumissions;
drop policy if exists "soumissions_delete" on soumissions;

create policy "soumissions_select" on soumissions
  for select to authenticated using (true);

create policy "soumissions_insert" on soumissions
  for insert to authenticated with check (true);

create policy "soumissions_update" on soumissions
  for update to authenticated using (true) with check (true);

create policy "soumissions_delete" on soumissions
  for delete to authenticated using (true);

-- =====================
-- TABLE: lignes_budget
-- =====================
alter table lignes_budget enable row level security;

drop policy if exists "lignes_budget_select" on lignes_budget;
drop policy if exists "lignes_budget_insert" on lignes_budget;
drop policy if exists "lignes_budget_update" on lignes_budget;
drop policy if exists "lignes_budget_delete" on lignes_budget;

create policy "lignes_budget_select" on lignes_budget
  for select to authenticated using (true);

create policy "lignes_budget_insert" on lignes_budget
  for insert to authenticated with check (true);

create policy "lignes_budget_update" on lignes_budget
  for update to authenticated using (true) with check (true);

create policy "lignes_budget_delete" on lignes_budget
  for delete to authenticated using (true);

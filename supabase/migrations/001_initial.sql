-- ============================================================
-- Foncia Locataire — Schéma initial
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE: users (étend auth.users de Supabase)
-- ============================================================
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  nom         text not null default '',
  prenom      text not null default '',
  telephone   text not null default '',
  date_naissance date,
  role        text not null default 'locataire'
              check (role in ('admin', 'locataire', 'suspendu')),
  created_at  timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "admins can view all users"
  on public.users for select
  using (
    exists (
      select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'
    )
  );

create policy "admins can update all users"
  on public.users for update
  using (
    exists (
      select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- Trigger: créer le profil user automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TABLE: logements
-- ============================================================
create table if not exists public.logements (
  id          uuid primary key default gen_random_uuid(),
  adresse     text not null,
  ville       text not null,
  cp          text not null,
  surface     numeric(6,2) not null default 0,
  nb_pieces   integer not null default 1,
  etage       integer default 0,
  loyer_hc    numeric(10,2) not null default 0,
  charges     numeric(10,2) not null default 0,
  description text,
  actif       boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.logements enable row level security;

create policy "anyone can view active logements"
  on public.logements for select
  using (actif = true);

create policy "admins full access logements"
  on public.logements for all
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ============================================================
-- TABLE: baux
-- ============================================================
create table if not exists public.baux (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  logement_id       uuid not null references public.logements(id),
  date_debut        date not null,
  date_fin          date,
  loyer_hc          numeric(10,2) not null,
  charges           numeric(10,2) not null default 0,
  depot_garantie    numeric(10,2) not null default 0,
  statut_signature  text not null default 'en_attente'
                    check (statut_signature in ('en_attente', 'signe', 'resilie', 'archive')),
  date_signature    timestamptz,
  lien_bail_url     text,
  created_at        timestamptz not null default now()
);

alter table public.baux enable row level security;

create policy "locataires can view own baux"
  on public.baux for select
  using (auth.uid() = user_id);

create policy "locataires can update own baux (signature)"
  on public.baux for update
  using (auth.uid() = user_id);

create policy "admins full access baux"
  on public.baux for all
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ============================================================
-- TABLE: loyers
-- ============================================================
create table if not exists public.loyers (
  id              uuid primary key default gen_random_uuid(),
  bail_id         uuid not null references public.baux(id) on delete cascade,
  mois            integer not null check (mois between 1 and 12),
  annee           integer not null,
  montant         numeric(10,2) not null,
  charges         numeric(10,2) not null default 0,
  statut          text not null default 'en_attente'
                  check (statut in ('en_attente', 'paye', 'retard')),
  date_paiement   timestamptz,
  created_at      timestamptz not null default now(),
  unique(bail_id, mois, annee)
);

alter table public.loyers enable row level security;

create policy "locataires can view own loyers"
  on public.loyers for select
  using (
    exists (
      select 1 from public.baux b where b.id = bail_id and b.user_id = auth.uid()
    )
  );

create policy "admins full access loyers"
  on public.loyers for all
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ============================================================
-- TABLE: documents
-- ============================================================
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  bail_id      uuid references public.baux(id),
  nom          text not null,
  type         text not null default 'autre'
               check (type in ('identite','bulletin_salaire','avis_imposition',
                               'justificatif_domicile','contrat_travail',
                               'bail','quittance','autre')),
  url          text not null,
  taille       bigint,
  date_upload  timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "locataires can view own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "admins full access documents"
  on public.documents for all
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ============================================================
-- TABLE: candidatures
-- ============================================================
create table if not exists public.candidatures (
  id                uuid primary key default gen_random_uuid(),
  logement_id       uuid references public.logements(id),
  nom               text not null,
  prenom            text not null,
  email             text not null,
  telephone         text not null default '',
  date_naissance    date,
  situation         text,
  revenus           numeric(10,2) not null default 0,
  type_contrat      text,
  employeur         text,
  statut            text not null default 'en_analyse'
                    check (statut in ('incomplet','en_analyse','accepte','refuse','signe')),
  ordre_priorite    integer not null default 999,
  garant_nom        text,
  garant_prenom     text,
  garant_email      text,
  garant_revenus    numeric(10,2),
  documents_urls    text[],
  created_at        timestamptz not null default now()
);

alter table public.candidatures enable row level security;

create policy "anyone can insert candidatures"
  on public.candidatures for insert
  with check (true);

create policy "admins full access candidatures"
  on public.candidatures for all
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ============================================================
-- TABLE: demandes
-- ============================================================
create table if not exists public.demandes (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  titre            text not null,
  description      text not null,
  categorie        text not null default 'autre'
                   check (categorie in ('reparation','plomberie','electricite','serrurerie','autre')),
  statut           text not null default 'ouvert'
                   check (statut in ('ouvert','en_cours','resolu','ferme')),
  date_creation    timestamptz not null default now(),
  date_resolution  timestamptz,
  photos_urls      text[]
);

alter table public.demandes enable row level security;

create policy "locataires can manage own demandes"
  on public.demandes for all
  using (auth.uid() = user_id);

create policy "admins full access demandes"
  on public.demandes for all
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ============================================================
-- TABLE: messages
-- ============================================================
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  demande_id  uuid references public.demandes(id),
  expediteur  text not null check (expediteur in ('locataire', 'admin')),
  contenu     text not null,
  date_envoi  timestamptz not null default now(),
  lu          boolean not null default false
);

alter table public.messages enable row level security;

create policy "locataires can view own messages"
  on public.messages for select
  using (auth.uid() = user_id);

create policy "locataires can insert own messages"
  on public.messages for insert
  with check (auth.uid() = user_id and expediteur = 'locataire');

create policy "locataires can update own messages (lu)"
  on public.messages for update
  using (auth.uid() = user_id);

create policy "admins full access messages"
  on public.messages for all
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ============================================================
-- TABLE: email_templates
-- ============================================================
create table if not exists public.email_templates (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  cle         text not null unique
              check (cle in (
                'confirmation_reception','dossier_incomplet',
                'acceptation_candidature','ouverture_espace_locataire',
                'rappel_bail_non_signe','quittance_disponible',
                'rappel_echeance_loyer'
              )),
  objet       text not null,
  contenu     text not null,
  variables   text[] not null default '{}',
  updated_at  timestamptz not null default now()
);

alter table public.email_templates enable row level security;

create policy "anyone can read email templates"
  on public.email_templates for select
  using (true);

create policy "admins can manage email templates"
  on public.email_templates for all
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- À créer dans le dashboard Supabase ou via la CLI :
-- supabase storage create documents --public
-- supabase storage create avatars --public

-- ============================================================
-- INDEX pour performances
-- ============================================================
create index if not exists idx_baux_user_id on public.baux(user_id);
create index if not exists idx_baux_logement_id on public.baux(logement_id);
create index if not exists idx_loyers_bail_id on public.loyers(bail_id);
create index if not exists idx_loyers_statut on public.loyers(statut);
create index if not exists idx_documents_user_id on public.documents(user_id);
create index if not exists idx_candidatures_logement on public.candidatures(logement_id);
create index if not exists idx_candidatures_statut on public.candidatures(statut);
create index if not exists idx_demandes_user_id on public.demandes(user_id);
create index if not exists idx_demandes_statut on public.demandes(statut);
create index if not exists idx_messages_user_id on public.messages(user_id);
create index if not exists idx_messages_lu on public.messages(lu);

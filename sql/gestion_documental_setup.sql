-- Control Documental (.docx) — setup de tablas + storage en Supabase
-- Correr una sola vez en el SQL Editor del dashboard de Supabase (Project > SQL Editor > New query > pegar todo > Run).
-- No toca la tabla sgi_documents ni el bucket sgi-pdfs que ya usa el Gestor Documental existente.

create extension if not exists pgcrypto;

-- =========================================================
-- Tablas
-- =========================================================

create table if not exists gd_documentos (
  id                  uuid primary key default gen_random_uuid(),
  codigo              text not null unique,
  titulo              text not null,
  tipo                text,
  sector_responsable  text,
  version_vigente_id  uuid,
  created_at          timestamptz not null default now()
);

create table if not exists gd_versiones (
  id                     uuid primary key default gen_random_uuid(),
  documento_id           uuid not null references gd_documentos(id) on delete cascade,
  numero_revision        int not null,
  fecha_revision         date not null,
  archivo_path           text not null,
  archivo_nombre_original text,
  archivo_firmado_path   text,
  estado                 text not null default 'borrador'
                           check (estado in ('borrador','en_revision','para_firma','vigente','obsoleto')),
  autor                  text,
  sectores_asignados     jsonb not null default '[]'::jsonb,
  firmas                 jsonb not null default '[]'::jsonb,
  historial              jsonb not null default '[]'::jsonb,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (documento_id, numero_revision)
);

create index if not exists gd_versiones_documento_id_idx on gd_versiones(documento_id);

-- =========================================================
-- RLS — abierta para el rol anon, igual de permisiva que sgi_documents hoy.
-- (Este proyecto no tiene autenticación real todavía; revisar antes de exponerlo
-- fuera de la red interna.)
-- =========================================================

alter table gd_documentos enable row level security;
alter table gd_versiones  enable row level security;

drop policy if exists "gd_documentos_anon_all" on gd_documentos;
create policy "gd_documentos_anon_all" on gd_documentos
  for all to anon using (true) with check (true);

drop policy if exists "gd_versiones_anon_all" on gd_versiones;
create policy "gd_versiones_anon_all" on gd_versiones
  for all to anon using (true) with check (true);

-- =========================================================
-- Storage: buckets nuevos + políticas abiertas para anon
-- =========================================================

insert into storage.buckets (id, name, public)
values ('gd-versiones', 'gd-versiones', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('gd-firmas', 'gd-firmas', true)
on conflict (id) do nothing;

drop policy if exists "gd_versiones_bucket_anon_all" on storage.objects;
create policy "gd_versiones_bucket_anon_all" on storage.objects
  for all to anon
  using (bucket_id = 'gd-versiones')
  with check (bucket_id = 'gd-versiones');

drop policy if exists "gd_firmas_bucket_anon_all" on storage.objects;
create policy "gd_firmas_bucket_anon_all" on storage.objects
  for all to anon
  using (bucket_id = 'gd-firmas')
  with check (bucket_id = 'gd-firmas');

-- Migra el módulo de Métricas/KPIs Sectoriales del backend local en SQLite
-- (http://localhost:5001, que no existe en la app publicada en Vercel) a
-- Supabase. Mismo modelo "un valor por sector/año/mes" que ya usaba SQLite,
-- solo que ahora vive en la nube y funciona para todos los usuarios.

create extension if not exists pgcrypto;

create table if not exists sgi_metrics (
  id         uuid primary key default gen_random_uuid(),
  sector     text not null,
  year       int not null,
  month      text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (sector, year, month)
);

grant select, insert, update, delete on table sgi_metrics to anon, authenticated;
grant usage on schema public to anon, authenticated;

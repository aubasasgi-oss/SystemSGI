-- Mismo patrón que sgi_comercial_metrics / sgi_asistencia_metrics: CCM
-- (Contingencias, Detección y Atención + Gestión Tránsito) como filas
-- independientes editables/borrables, en vez del blob mensual único de
-- sgi_metrics (sectores "ccm" y "ccm_gestion").

create table if not exists sgi_ccm_metrics (
  id         uuid primary key default gen_random_uuid(),
  tipo       text not null check (tipo in ('contingencias','gestion_transito')),
  fecha      date not null,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sgi_ccm_metrics_tipo_fecha_idx on sgi_ccm_metrics (tipo, fecha);

alter table sgi_ccm_metrics disable row level security;

grant select, insert, update, delete on table sgi_ccm_metrics to anon, authenticated;
grant usage on schema public to anon, authenticated;

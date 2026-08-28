-- Mismo patrón que sgi_comercial_metrics y sgi_asistencia_metrics: la carga
-- del SPP (Gerencia de Operaciones) deja de ser un blob mensual único en
-- sgi_metrics y pasa a ser una FILA independiente por carga (una por fecha y
-- sitio), para poder registrar varios peajes en el mismo mes y editar o
-- borrar cada carga por separado, igual que la planilla de origen.

create extension if not exists pgcrypto;

create table if not exists sgi_operaciones_metrics (
  id         uuid primary key default gen_random_uuid(),
  fecha      date not null,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sgi_operaciones_metrics_fecha_idx on sgi_operaciones_metrics (fecha);

-- Mismo criterio que el resto de tablas de métricas: sin RLS; el acceso al
-- módulo se controla por rol/sector en el frontend.
alter table sgi_operaciones_metrics disable row level security;

grant select, insert, update, delete on table sgi_operaciones_metrics to anon, authenticated;
grant usage on schema public to anon, authenticated;

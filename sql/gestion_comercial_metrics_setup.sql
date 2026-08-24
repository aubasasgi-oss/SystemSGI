-- Tabla para los 4 formularios de Gerencia Comercial (Quejas_Reclamos, TelePASE,
-- Atencion_Telef_Conformidad, Tiempo_respuesta_QyR). A diferencia de sgi_metrics
-- (un blob por sector/año/mes), acá cada carga es una FILA independiente, con
-- fecha propia, para poder editarla/borrarla individualmente y permitir varias
-- cargas por mes (por sitio, por concesión, etc.), igual que la planilla de origen.

create extension if not exists pgcrypto;

create table if not exists sgi_comercial_metrics (
  id         uuid primary key default gen_random_uuid(),
  tipo       text not null check (tipo in ('quejas_reclamos','telepase','atencion','tiempo_respuesta')),
  fecha      date not null,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sgi_comercial_metrics_tipo_fecha_idx on sgi_comercial_metrics (tipo, fecha);

-- Mismo criterio que sgi_documents/sgi_metrics: sin RLS, la app no usa auth de
-- fila-por-usuario, controla el acceso a este módulo por rol/sector en el frontend.
alter table sgi_comercial_metrics disable row level security;

grant select, insert, update, delete on table sgi_comercial_metrics to anon, authenticated;
grant usage on schema public to anon, authenticated;

-- Mismo patrón que sgi_comercial_metrics / sgi_mantenimiento_metrics: RRHH
-- (Tiempo de Respuesta ante Solicitud de Personal + Observaciones) como
-- filas independientes editables/borrables, en vez del blob mensual único
-- de sgi_metrics (sector "rrhh").

create table if not exists sgi_rrhh_metrics (
  id         uuid primary key default gen_random_uuid(),
  tipo       text not null check (tipo in ('tiempo_respuesta','observaciones')),
  fecha      date not null,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sgi_rrhh_metrics_tipo_fecha_idx on sgi_rrhh_metrics (tipo, fecha);

alter table sgi_rrhh_metrics disable row level security;

grant select, insert, update, delete on table sgi_rrhh_metrics to anon, authenticated;
grant usage on schema public to anon, authenticated;

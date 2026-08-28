-- Mismo patrón que sgi_comercial_metrics: los 4 formularios de Asistencia
-- Vial (Gestión AV1, Factor de Desempeño, Servicio 1° Auxilio, Servicio
-- Auxilio Mecánico) como filas independientes editables/borrables, en vez
-- del blob mensual único de sgi_metrics.

create table if not exists sgi_asistencia_metrics (
  id         uuid primary key default gen_random_uuid(),
  tipo       text not null check (tipo in ('gestion_av1','factor_desempeno','serv_1er_aux','serv_aux_mecanico')),
  fecha      date not null,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sgi_asistencia_metrics_tipo_fecha_idx on sgi_asistencia_metrics (tipo, fecha);

alter table sgi_asistencia_metrics disable row level security;

grant select, insert, update, delete on table sgi_asistencia_metrics to anon, authenticated;
grant usage on schema public to anon, authenticated;

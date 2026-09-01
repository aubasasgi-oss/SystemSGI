-- Mismo patrón que sgi_comercial_metrics / sgi_rrhh_metrics: Asuntos
-- Legales, Tecnología y Sistemas, y Relaciones Institucionales pasan del
-- blob mensual único de sgi_metrics a filas independientes editables/
-- borrables.

create table if not exists sgi_legales_metrics (
  id         uuid primary key default gen_random_uuid(),
  tipo       text not null check (tipo in ('respuestas_gc','matriz_legal','observaciones')),
  fecha      date not null,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sgi_legales_metrics_tipo_fecha_idx on sgi_legales_metrics (tipo, fecha);
alter table sgi_legales_metrics disable row level security;
grant select, insert, update, delete on table sgi_legales_metrics to anon, authenticated;

create table if not exists sgi_sistemas_metrics (
  id         uuid primary key default gen_random_uuid(),
  tipo       text not null check (tipo in ('pmp','tickets')),
  fecha      date not null,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sgi_sistemas_metrics_tipo_fecha_idx on sgi_sistemas_metrics (tipo, fecha);
alter table sgi_sistemas_metrics disable row level security;
grant select, insert, update, delete on table sgi_sistemas_metrics to anon, authenticated;

create table if not exists sgi_institucionales_metrics (
  id         uuid primary key default gen_random_uuid(),
  fecha      date not null,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sgi_institucionales_metrics_fecha_idx on sgi_institucionales_metrics (fecha);
alter table sgi_institucionales_metrics disable row level security;
grant select, insert, update, delete on table sgi_institucionales_metrics to anon, authenticated;

grant usage on schema public to anon, authenticated;

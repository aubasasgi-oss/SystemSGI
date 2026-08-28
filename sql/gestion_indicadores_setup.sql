-- El módulo "Objetivos y Metas (KPIs)" (Indicators.jsx) tiene el mismo
-- problema que tenía la Matriz de Riesgos antes de arreglarla: los 127
-- indicadores viven hardcodeados en frontend/src/data/sgiData.js (el mismo
-- dataset del reporte Power BI que armaste), y "Revisar/Ajustar meta" solo
-- actualiza el estado de React en memoria — se pierde todo al recargar, y
-- el botón "Nuevo Indicador" ni siquiera hace nada. Esta migración crea las
-- tablas reales; los 127 indicadores se cargan aparte con un script (no por
-- SQL, para no tener que escapar a mano todo el HTML de "recursos").

create table if not exists sgi_indicadores (
  id          int primary key,
  anio        int not null,
  documento   text not null,
  obj_num     int,
  norma       text,
  proceso     text,
  indicador   text not null,
  meta        text,
  tipo        text,
  frecuencia  text,
  algoritmo   text,
  responsable text,
  estrategia  text,
  vigencia    text,
  nota        text default '',
  recursos    text default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists sgi_indicadores_historial (
  id           uuid primary key default gen_random_uuid(),
  indicador_id int not null references sgi_indicadores(id) on delete cascade,
  fecha        date not null default current_date,
  usuario      text,
  texto        text,
  created_at   timestamptz not null default now()
);

create index if not exists sgi_indicadores_historial_indicador_idx on sgi_indicadores_historial (indicador_id);

alter table sgi_indicadores disable row level security;
alter table sgi_indicadores_historial disable row level security;

grant select, insert, update, delete on table sgi_indicadores to anon, authenticated;
grant select, insert, update, delete on table sgi_indicadores_historial to anon, authenticated;
grant usage on schema public to anon, authenticated;

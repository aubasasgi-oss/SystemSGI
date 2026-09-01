-- El Análisis de Contexto (Context.jsx) tenía el mismo problema que tenía la
-- Matriz de Riesgos antes de arreglarla: los factores críticos vivían
-- hardcodeados en el código (initialContext) y "Guardar" solo actualizaba
-- el estado de React en memoria — se perdía todo al recargar.

create table if not exists sgi_contexto (
  id         text primary key,
  anio       int not null,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table sgi_contexto disable row level security;

grant select, insert, update, delete on table sgi_contexto to anon, authenticated;
grant usage on schema public to anon, authenticated;

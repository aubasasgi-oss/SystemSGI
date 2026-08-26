-- La Matriz de Riesgos Operativos (Risks.jsx) nunca tuvo backend: arrancaba
-- siempre con 3 filas de ejemplo hardcodeadas en el código (initialRisks) y
-- "Guardar" solo actualizaba el estado de React en memoria — se perdía todo
-- al recargar la página. Esta tabla la persiste en Supabase de verdad.

create table if not exists sgi_risks (
  id         text primary key,
  anio       int not null,
  proceso    text not null,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sgi_risks_anio_proceso_idx on sgi_risks (anio, proceso);

alter table sgi_risks disable row level security;

grant select, insert, update, delete on table sgi_risks to anon, authenticated;
grant usage on schema public to anon, authenticated;

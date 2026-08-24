-- Postgres activa RLS por defecto en tablas nuevas. sgi_documents la tiene
-- deshabilitada (así funciona hoy), así que hacemos lo mismo acá para que
-- el guardado de métricas no quede bloqueado.
alter table sgi_metrics disable row level security;

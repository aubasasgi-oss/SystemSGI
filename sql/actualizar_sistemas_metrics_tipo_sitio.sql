-- Migración: Permitir tipo 'sitio' en sgi_sistemas_metrics
alter table sgi_sistemas_metrics drop constraint if exists sgi_sistemas_metrics_tipo_check;
alter table sgi_sistemas_metrics add constraint sgi_sistemas_metrics_tipo_check check (tipo in ('pmp', 'tickets', 'sitio'));

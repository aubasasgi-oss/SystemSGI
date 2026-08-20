-- Agrega la columna docx_url a sgi_documents: guarda el Word real "maestro"
-- de cada documento, para no tener que reconvertir desde PDF en cada edición.
-- No borra ni modifica nada existente.

alter table sgi_documents add column if not exists docx_url text;

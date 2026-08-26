-- La columna "proceso" en realidad se usaba como el sector que controla
-- permisos (quién puede editar el riesgo). Se renombra a "sector" para que
-- el campo "Proceso" del formulario pueda ser texto libre sin afectar los
-- permisos, y se agrega Concesión (BALP / SVIA / BALP-SVIA) como campo del
-- riesgo (vive dentro del jsonb "data", no hace falta columna nueva).

alter table sgi_risks rename column proceso to sector;

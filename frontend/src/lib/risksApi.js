import { supabase } from '../supabaseClient';

// Persiste la Matriz de Riesgos en sgi_risks. `año` se guarda en la columna
// `anio` (sin ñ) para evitar problemas de encoding en el nombre de columna,
// pero se traduce de vuelta a `año` al leer para no tocar el resto del
// componente, que ya usa ese nombre de campo en todos lados.

const filaARiesgo = (row) => ({
  id: row.id,
  proceso: row.proceso,
  año: row.anio,
  ...row.data,
});

export async function listarRiesgos() {
  const { data, error } = await supabase
    .from('sgi_risks')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(filaARiesgo);
}

export async function guardarRiesgo(risk) {
  const { id, proceso, año, ...resto } = risk;
  const rowId = id || `R-${Date.now()}`;
  const { error } = await supabase
    .from('sgi_risks')
    .upsert({ id: rowId, proceso, anio: año, data: resto, updated_at: new Date().toISOString() });
  if (error) throw error;
  return rowId;
}

export async function eliminarRiesgo(id) {
  const { error } = await supabase.from('sgi_risks').delete().eq('id', id);
  if (error) throw error;
}

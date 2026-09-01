import { supabase } from '../supabaseClient';

const filaAItem = (row) => ({
  id: row.id,
  año: row.anio,
  ...row.data,
});

export async function listarContexto() {
  const { data, error } = await supabase
    .from('sgi_contexto')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(filaAItem);
}

export async function guardarContexto(item) {
  const { id, año, ...resto } = item;
  const rowId = id || `C-${Date.now()}`;
  const { error } = await supabase
    .from('sgi_contexto')
    .upsert({ id: rowId, anio: año, data: resto, updated_at: new Date().toISOString() });
  if (error) throw error;
  return rowId;
}

export async function eliminarContexto(id) {
  const { error } = await supabase.from('sgi_contexto').delete().eq('id', id);
  if (error) throw error;
}

import { supabase } from '../supabaseClient';

export async function listarIndicadores() {
  const { data, error } = await supabase.from('sgi_indicadores').select('*').order('id');
  if (error) throw error;
  return data || [];
}

export async function insertarIndicador(indicador) {
  const { data: existentes, error: selErr } = await supabase.from('sgi_indicadores').select('id').order('id', { ascending: false }).limit(1);
  if (selErr) throw selErr;
  const nextId = existentes && existentes[0] ? existentes[0].id + 1 : 1;
  const { error } = await supabase.from('sgi_indicadores').insert({ id: nextId, ...indicador });
  if (error) throw error;
  return nextId;
}

export async function actualizarMetaIndicador(id, meta) {
  const { error } = await supabase
    .from('sgi_indicadores')
    .update({ meta, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function listarHistorialIndicadores() {
  const { data, error } = await supabase
    .from('sgi_indicadores_historial')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function agregarHistorialIndicador(indicadorId, usuario, texto) {
  const { error } = await supabase
    .from('sgi_indicadores_historial')
    .insert({ indicador_id: indicadorId, usuario, texto });
  if (error) throw error;
}

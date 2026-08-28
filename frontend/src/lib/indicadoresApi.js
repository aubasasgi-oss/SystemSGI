import { supabase } from '../supabaseClient';

export async function listarIndicadores() {
  const { data, error } = await supabase.from('sgi_indicadores').select('*').order('id');
  if (error) throw error;
  return data || [];
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

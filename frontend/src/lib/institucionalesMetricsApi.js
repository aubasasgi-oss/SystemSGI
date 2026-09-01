import { supabase } from '../supabaseClient';

// Un solo tipo de carga (Efectividad RRSS) → sin columna "tipo", mismo
// patrón que operacionesMetricsApi.js.

export async function listarInstitucionalesMetrics() {
  const { data, error } = await supabase
    .from('sgi_institucionales_metrics')
    .select('*')
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function guardarInstitucionalesMetric(id, fecha, data) {
  if (id) {
    const { error } = await supabase
      .from('sgi_institucionales_metrics')
      .update({ fecha, data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('sgi_institucionales_metrics').insert({ fecha, data });
    if (error) throw error;
  }
}

export async function eliminarInstitucionalesMetric(id) {
  const { error } = await supabase.from('sgi_institucionales_metrics').delete().eq('id', id);
  if (error) throw error;
}

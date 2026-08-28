import { supabase } from '../supabaseClient';

// CRUD sobre sgi_operaciones_metrics: filas independientes por carga (una por
// fecha y sitio), mismo patrón que comercialMetricsApi.js y asistenciaMetricsApi.js,
// en vez del blob mensual único de sgi_metrics.

export async function listarOperacionesMetrics() {
  const { data, error } = await supabase
    .from('sgi_operaciones_metrics')
    .select('*')
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function guardarOperacionesMetric(id, fecha, data) {
  if (id) {
    const { error } = await supabase
      .from('sgi_operaciones_metrics')
      .update({ fecha, data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('sgi_operaciones_metrics')
      .insert({ fecha, data });
    if (error) throw error;
  }
}

export async function eliminarOperacionesMetric(id) {
  const { error } = await supabase.from('sgi_operaciones_metrics').delete().eq('id', id);
  if (error) throw error;
}

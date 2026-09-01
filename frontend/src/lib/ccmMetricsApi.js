import { supabase } from '../supabaseClient';

// CRUD sobre sgi_ccm_metrics: mismo patrón que comercialMetricsApi.js /
// asistenciaMetricsApi.js (filas independientes por carga, no un blob
// mensual).

export async function listarCcmMetrics(tipo) {
  const { data, error } = await supabase
    .from('sgi_ccm_metrics')
    .select('*')
    .eq('tipo', tipo)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listarCcmMetricsMultiples(tipos) {
  const { data, error } = await supabase
    .from('sgi_ccm_metrics')
    .select('*')
    .in('tipo', tipos);
  if (error) throw error;
  return data || [];
}

export async function guardarCcmMetric(tipo, id, fecha, data) {
  if (id) {
    const { error } = await supabase
      .from('sgi_ccm_metrics')
      .update({ fecha, data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('sgi_ccm_metrics')
      .insert({ tipo, fecha, data });
    if (error) throw error;
  }
}

export async function eliminarCcmMetric(id) {
  const { error } = await supabase.from('sgi_ccm_metrics').delete().eq('id', id);
  if (error) throw error;
}

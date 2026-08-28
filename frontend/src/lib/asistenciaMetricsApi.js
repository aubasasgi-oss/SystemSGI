import { supabase } from '../supabaseClient';

// CRUD sobre sgi_asistencia_metrics: mismo patrón que comercialMetricsApi.js
// (filas independientes por carga, no un blob mensual).

export async function listarAsistenciaMetrics(tipo) {
  const { data, error } = await supabase
    .from('sgi_asistencia_metrics')
    .select('*')
    .eq('tipo', tipo)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listarAsistenciaMetricsMultiples(tipos) {
  const { data, error } = await supabase
    .from('sgi_asistencia_metrics')
    .select('*')
    .in('tipo', tipos);
  if (error) throw error;
  return data || [];
}

export async function guardarAsistenciaMetric(tipo, id, fecha, data) {
  if (id) {
    const { error } = await supabase
      .from('sgi_asistencia_metrics')
      .update({ fecha, data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('sgi_asistencia_metrics')
      .insert({ tipo, fecha, data });
    if (error) throw error;
  }
}

export async function eliminarAsistenciaMetric(id) {
  const { error } = await supabase.from('sgi_asistencia_metrics').delete().eq('id', id);
  if (error) throw error;
}

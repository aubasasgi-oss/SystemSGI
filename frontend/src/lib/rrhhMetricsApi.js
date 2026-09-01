import { supabase } from '../supabaseClient';

// CRUD sobre sgi_rrhh_metrics: mismo patrón que ccmMetricsApi.js /
// mantenimientoMetricsApi.js (filas independientes por carga).

export async function listarRrhhMetrics(tipo) {
  const { data, error } = await supabase
    .from('sgi_rrhh_metrics')
    .select('*')
    .eq('tipo', tipo)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listarRrhhMetricsMultiples(tipos) {
  const { data, error } = await supabase
    .from('sgi_rrhh_metrics')
    .select('*')
    .in('tipo', tipos);
  if (error) throw error;
  return data || [];
}

export async function guardarRrhhMetric(tipo, id, fecha, data) {
  if (id) {
    const { error } = await supabase
      .from('sgi_rrhh_metrics')
      .update({ fecha, data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('sgi_rrhh_metrics')
      .insert({ tipo, fecha, data });
    if (error) throw error;
  }
}

export async function eliminarRrhhMetric(id) {
  const { error } = await supabase.from('sgi_rrhh_metrics').delete().eq('id', id);
  if (error) throw error;
}

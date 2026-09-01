import { supabase } from '../supabaseClient';

// CRUD sobre sgi_mantenimiento_metrics: mismo patrón que ccmMetricsApi.js
// (filas independientes por carga, no un blob mensual).

export async function listarMantenimientoMetrics(tipo) {
  const { data, error } = await supabase
    .from('sgi_mantenimiento_metrics')
    .select('*')
    .eq('tipo', tipo)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listarMantenimientoMetricsMultiples(tipos) {
  const { data, error } = await supabase
    .from('sgi_mantenimiento_metrics')
    .select('*')
    .in('tipo', tipos);
  if (error) throw error;
  return data || [];
}

export async function guardarMantenimientoMetric(tipo, id, fecha, data) {
  if (id) {
    const { error } = await supabase
      .from('sgi_mantenimiento_metrics')
      .update({ fecha, data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('sgi_mantenimiento_metrics')
      .insert({ tipo, fecha, data });
    if (error) throw error;
  }
}

export async function eliminarMantenimientoMetric(id) {
  const { error } = await supabase.from('sgi_mantenimiento_metrics').delete().eq('id', id);
  if (error) throw error;
}

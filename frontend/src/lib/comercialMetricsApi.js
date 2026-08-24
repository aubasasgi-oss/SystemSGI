import { supabase } from '../supabaseClient';

// CRUD sobre sgi_comercial_metrics: filas independientes por carga (no un blob
// mensual como sgi_metrics), para que Gerencia Comercial pueda ver, editar y
// borrar cada carga individual de sus 4 formularios.

export async function listarComercialMetrics(tipo) {
  const { data, error } = await supabase
    .from('sgi_comercial_metrics')
    .select('*')
    .eq('tipo', tipo)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listarComercialMetricsMultiples(tipos) {
  const { data, error } = await supabase
    .from('sgi_comercial_metrics')
    .select('*')
    .in('tipo', tipos);
  if (error) throw error;
  return data || [];
}

export async function guardarComercialMetric(tipo, id, fecha, data) {
  if (id) {
    const { error } = await supabase
      .from('sgi_comercial_metrics')
      .update({ fecha, data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('sgi_comercial_metrics')
      .insert({ tipo, fecha, data });
    if (error) throw error;
  }
}

export async function eliminarComercialMetric(id) {
  const { error } = await supabase.from('sgi_comercial_metrics').delete().eq('id', id);
  if (error) throw error;
}

import { supabase } from '../supabaseClient';

export async function listarSistemasMetrics(tipo) {
  const { data, error } = await supabase
    .from('sgi_sistemas_metrics')
    .select('*')
    .eq('tipo', tipo)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listarSistemasMetricsMultiples(tipos) {
  const { data, error } = await supabase
    .from('sgi_sistemas_metrics')
    .select('*')
    .in('tipo', tipos);
  if (error) throw error;
  return data || [];
}

export async function guardarSistemasMetric(tipo, id, fecha, data) {
  if (id) {
    const { error } = await supabase
      .from('sgi_sistemas_metrics')
      .update({ fecha, data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('sgi_sistemas_metrics').insert({ tipo, fecha, data });
    if (error) throw error;
  }
}

export async function eliminarSistemasMetric(id) {
  const { error } = await supabase.from('sgi_sistemas_metrics').delete().eq('id', id);
  if (error) throw error;
}

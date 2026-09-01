import { supabase } from '../supabaseClient';

export async function listarLegalesMetrics(tipo) {
  const { data, error } = await supabase
    .from('sgi_legales_metrics')
    .select('*')
    .eq('tipo', tipo)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listarLegalesMetricsMultiples(tipos) {
  const { data, error } = await supabase
    .from('sgi_legales_metrics')
    .select('*')
    .in('tipo', tipos);
  if (error) throw error;
  return data || [];
}

export async function guardarLegalesMetric(tipo, id, fecha, data) {
  if (id) {
    const { error } = await supabase
      .from('sgi_legales_metrics')
      .update({ fecha, data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('sgi_legales_metrics').insert({ tipo, fecha, data });
    if (error) throw error;
  }
}

export async function eliminarLegalesMetric(id) {
  const { error } = await supabase.from('sgi_legales_metrics').delete().eq('id', id);
  if (error) throw error;
}

import { supabase } from '../supabaseClient';

export async function listarSistemasMetrics(tipo) {
  let query = supabase
    .from('sgi_sistemas_metrics')
    .select('*')
    .order('fecha', { ascending: false });

  if (tipo === 'sitio') {
    const { data, error } = await query.in('tipo', ['sitio', 'pmp']);
    if (error) throw error;
    return (data || []).filter(r => r.tipo === 'sitio' || (r.tipo === 'pmp' && r.data?.sitio));
  }

  if (tipo === 'pmp') {
    const { data, error } = await query.eq('tipo', 'pmp');
    if (error) throw error;
    return (data || []).filter(r => !r.data?.sitio);
  }

  const { data, error } = await query.eq('tipo', tipo);
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
    return;
  }

  const { error } = await supabase.from('sgi_sistemas_metrics').insert({ tipo, fecha, data });
  if (error) {
    if (tipo === 'sitio' && (error.code === '23514' || (error.message && error.message.toLowerCase().includes('check')))) {
      const fallback = await supabase.from('sgi_sistemas_metrics').insert({
        tipo: 'pmp',
        fecha,
        data: { ...data, _tipo: 'sitio' }
      });
      if (fallback.error) throw fallback.error;
      return;
    }
    throw error;
  }
}

export async function eliminarSistemasMetric(id) {
  const { error } = await supabase.from('sgi_sistemas_metrics').delete().eq('id', id);
  if (error) throw error;
}

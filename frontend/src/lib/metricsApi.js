import { supabase } from '../supabaseClient';

// Reemplaza al viejo backend local (http://localhost:5001/api/metrics, que
// no existe en la app publicada) — mismo modelo: un registro por
// sector/año/mes, con un blob JSON adentro.

export async function obtenerMetricaMensual(sector, year, month) {
  let query = supabase.from('sgi_metrics').select('*').eq('sector', sector);
  if (year) query = query.eq('year', Number(year));
  if (month) query = query.eq('month', month);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function guardarMetricaMensual(sector, year, month, data) {
  const { error } = await supabase
    .from('sgi_metrics')
    .upsert(
      { sector, year: Number(year), month, data, updated_at: new Date().toISOString() },
      { onConflict: 'sector,year,month' }
    );
  if (error) throw error;
}

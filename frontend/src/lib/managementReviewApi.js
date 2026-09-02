import { supabase } from '../supabaseClient';

const filaAReview = (row) => ({
  id: row.id,
  year: row.year,
  status: row.status,
  date: row.date,
  participants: row.participants,
  data: row.data || {},
});

export async function listarManagementReviews() {
  const { data, error } = await supabase
    .from('sgi_management_reviews')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(filaAReview);
}

export async function guardarManagementReview(review) {
  const { id, year, status, date, participants, data } = review;
  const { error } = await supabase
    .from('sgi_management_reviews')
    .upsert({ id, year, status, date, participants, data, updated_at: new Date().toISOString() });
  if (error) throw error;
  return id;
}

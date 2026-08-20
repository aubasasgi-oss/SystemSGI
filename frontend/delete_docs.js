const SUPABASE_URL = 'https://zkygkkoljphknwbcllec.supabase.co';
const SUPABASE_KEY = 'sb_publishable_u7Ct38S71i8XZic_M8PlxQ_YkGOKyg8';

async function deleteSeeded() {
  const codes = [
    'PAU-01', 'PAU-02', 'PAU-03', 'PAU-04', 'PAU-05', 'PAU-06', 'PAU-07', 'PAU-08', 'PAU-09',
    'ITAU-04-01', 'ITAU-04-02', 'ITAU-04-03', 'ITAU-04-04', 'ITAU-04-05', 'ITAU-04-06', 'ITAU-04-07', 'ITAU-04-08', 'ITAU-04-09'
  ];

  for (const code of codes) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/sgi_documents?code=eq.${code}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    console.log(`Deleted ${code}: ${res.status}`);
  }
}

deleteSeeded();

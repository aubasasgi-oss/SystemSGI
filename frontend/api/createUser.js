import { createClient } from '@supabase/supabase-js';

// Las variables de entorno pegadas desde Word/Notion/notas suelen traer
// comillas y guiones "tipográficos" (–, —, ", ') en vez de los caracteres
// ASCII simples que espera un header HTTP — eso rompe la clave sin que se
// note a simple vista. Se normaliza antes de usarla para no depender de que
// el copy-paste salga perfecto cada vez.
function sanearClave(valor) {
  if (!valor) return valor;
  return valor
    .trim()
    .replace(/[‐-―]/g, '-') // guiones tipográficos -> guion normal
    .replace(/[‘’]/g, "'")  // comillas simples tipográficas
    .replace(/[“”]/g, '"'); // comillas dobles tipográficas
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  const supabaseUrl = sanearClave(process.env.VITE_SUPABASE_URL);
  const serviceRoleKey = sanearClave(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Configuración del servidor incompleta (faltan variables de entorno)' });
  }

  // Usamos el SERVICE ROLE KEY para evadir RLS y no modificar la sesión actual
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Confirmar automáticamente
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, user: data.user });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno al crear usuario: ' + error.message });
  }
}

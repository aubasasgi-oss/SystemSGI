import { createClient } from '@supabase/supabase-js';

function sanearClave(valor) {
  if (!valor) return valor;
  return valor
    .trim()
    .replace(/[‐-―]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { userId, newPassword, email } = req.body;

  if ((!userId && !email) || !newPassword) {
    return res.status(400).json({ error: 'Usuario y nueva contraseña son obligatorios' });
  }

  const supabaseUrl = sanearClave(process.env.VITE_SUPABASE_URL);
  const serviceRoleKey = sanearClave(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Faltan variables de entorno en el servidor (SUPABASE_SERVICE_ROLE_KEY)' });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    let targetUserId = userId;

    // Si no tenemos el userId pero sí el email, buscar el ID en profiles
    if (!targetUserId && email) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (profile?.id) {
        targetUserId = profile.id;
      }
    }

    if (!targetUserId) {
      return res.status(404).json({ error: 'No se encontró el identificador del usuario.' });
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
      password: newPassword
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, message: 'Contraseña blanqueada con éxito' });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno: ' + error.message });
  }
}

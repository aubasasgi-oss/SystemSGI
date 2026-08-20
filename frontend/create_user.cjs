const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zkygkkoljphknwbcllec.supabase.co';
const supabaseKey = 'sb_publishable_u7Ct38S71i8XZic_M8PlxQ_YkGOKyg8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const email = 'sgiaubasa@gmail.com';
  const password = 'Aubasa2026!';

  console.log(`Intentando registrar: ${email}`);
  
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (error) {
    console.error('Error creando usuario:', error.message);
    return;
  }

  console.log('Usuario creado con éxito (o ya existía). ID:', data.user?.id);

  if (data.user?.id) {
    console.log('Asignando permisos SGI...');
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'SGI', sector: 'SGI' })
      .eq('id', data.user.id);

    if (profileError) {
      console.error('Error actualizando perfil:', profileError.message);
    } else {
      console.log('Perfil actualizado a SGI exitosamente.');
    }
  }
}

main();

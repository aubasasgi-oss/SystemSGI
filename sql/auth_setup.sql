-- Script para crear la tabla de perfiles (roles y sectores)
-- Ejecutar esto en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'Sector', -- 'SGI' o 'Sector'
    sector TEXT NOT NULL, -- Ej: 'Gerencia Comercial', 'Recursos Humanos', 'Sistemas', 'SGI'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Habilitar RLS (Seguridad a nivel de fila) pero permitir lectura general para probar
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los perfiles son visibles por usuarios autenticados" 
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated');

-- Trigger para crear automáticamente el perfil cuando un usuario se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, sector)
  VALUES (new.id, new.email, 'Sector', 'Pendiente de Asignación');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enlazar el trigger (Si falla porque el trigger ya existe, puedes ignorarlo o borrar el viejo)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Nota: Deberás crear tus usuarios desde la interfaz de Authentication en Supabase,
-- y luego entrar a la tabla 'profiles' para cambiarles manualmente el rol a 'SGI' o el sector correspondiente.

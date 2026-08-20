-- Limpiar todas las políticas existentes en profiles
DROP POLICY IF EXISTS "Los perfiles son visibles por usuarios autenticados" ON public.profiles;
DROP POLICY IF EXISTS "Permitir actualizaciones a SGI" ON public.profiles;
DROP POLICY IF EXISTS "Permitir borrado a SGI" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- Asegurarse de que RLS esté habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Política de Lectura: Todos los usuarios logueados pueden leer los perfiles
CREATE POLICY "Permitir lectura general"
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated');

-- 2. Política de Actualización: Solo los administradores SGI pueden modificar
CREATE POLICY "Permitir actualización a SGI"
ON public.profiles FOR UPDATE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SGI'
);

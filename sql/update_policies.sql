-- Ejecuta este script en el SQL Editor de Supabase para permitir que los administradores SGI modifiquen la tabla profiles

-- 1. Eliminar cualquier política de actualización anterior (si existiera)
DROP POLICY IF EXISTS "Permitir actualizaciones a SGI" ON public.profiles;

-- 2. Crear una nueva política que permite el UPDATE si el usuario actual tiene el rol 'SGI' en su propio registro de profiles
CREATE POLICY "Permitir actualizaciones a SGI"
ON public.profiles
FOR UPDATE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SGI'
);

-- (Opcional) Si quieres que los SGI también puedan borrar usuarios
DROP POLICY IF EXISTS "Permitir borrado a SGI" ON public.profiles;
CREATE POLICY "Permitir borrado a SGI"
ON public.profiles
FOR DELETE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SGI'
);

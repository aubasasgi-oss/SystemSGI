import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'SGI' o 'Sector'
  const [userSector, setUserSector] = useState(null); // Ej: 'Gerencia Comercial'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Obtener la sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Escuchar cambios de sesión (Login / Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUserRole(null);
        setUserSector(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, sector')
        .eq('id', userId)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }
      
      if (data) {
        setUserRole(data.role);
        setUserSector(data.sector);
      } else {
        // Fallback por si no existe el perfil aún
        setUserRole('Sector');
        setUserSector('Pendiente de Asignación');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const checkPermission = (itemSector) => {
    if (userRole === 'SGI') return true; // Admin global
    return userSector === itemSector; // Permiso solo si coincide el sector
  };

  return (
    <AuthContext.Provider value={{ user, userRole, userSector, loading, login, logout, checkPermission }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

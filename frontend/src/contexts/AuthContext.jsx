import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // Por defecto el usuario es de SGI (Admin)
  const [userRole, setUserRole] = useState('SGI');

  const checkPermission = (itemSector) => {
    if (userRole === 'SGI') return true; // Admin global
    return userRole === itemSector; // Permiso solo si coincide el sector
  };

  return (
    <AuthContext.Provider value={{ userRole, setUserRole, checkPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

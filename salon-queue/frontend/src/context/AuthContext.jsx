// src/context/AuthContext.jsx
// Stores JWT and decoded staff payload; persists token to sessionStorage.

import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'salon_staff_token';

function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || null);
  const [staff, setStaff] = useState(() => {
    const t = sessionStorage.getItem(TOKEN_KEY);
    return t ? decodeToken(t) : null;
  });

  const login = useCallback((newToken, staffData) => {
    sessionStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setStaff(staffData);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setStaff(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, staff, login, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

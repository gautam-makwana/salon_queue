// src/components/RequireAuth.jsx
// Protects staff routes; redirects to /login if not authenticated or wrong role.

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RequireAuth({ children, roles }) {
  const { isLoggedIn, staff } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(staff?.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

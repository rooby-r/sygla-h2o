import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { hasPermission } from '../../config/permissions';

const ProtectedRoute = ({ children, module, action = 'view' }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier si l'utilisateur doit changer son mot de passe
  const mustChangePassword = localStorage.getItem('must_change_password') === 'true';
  const isOnChangePasswordPage = location.pathname === '/change-password-required';
  
  // Rediriger vers la page de changement si nécessaire (sauf si déjà sur cette page)
  if (mustChangePassword && !isOnChangePasswordPage && user.role !== 'admin') {
    return <Navigate to="/change-password-required" replace />;
  }

  // Si un module est spécifié, vérifier la permission
  if (module && !hasPermission(user, module, action)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;

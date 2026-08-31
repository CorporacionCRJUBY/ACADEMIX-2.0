// FILE: frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../hooks/useAuth';
import { Box, CircularProgress } from '@mui/material';

/**
 * Componente que protege rutas que requieren autenticación
 */
const ProtectedRoute = ({
  children,
  permission,
  module,
  action,
  redirectTo = '/login',
  requireAuth = true,
}) => {
  const { user, loading, hasPermission, hasModulePermission } = useAuth();

  // Mostrar loading mientras se verifica autenticación
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Verificar autenticación
  if (requireAuth && !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si no requiere autenticación y ya hay usuario, redirigir al dashboard
  if (!requireAuth && user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Verificar permisos
  if (user && (permission || (module && action))) {
    let hasAccess = false;

    if (permission) {
      hasAccess = hasPermission(permission);
    } else if (module && action) {
      hasAccess = hasModulePermission(module, action);
    }

    if (!hasAccess) {
      // Redirigir a página de acceso denegado
      return <Navigate to="/forbidden" replace />;
    }
  }

  // Renderizar children o Outlet para rutas anidadas
  return children ? children : <Outlet />;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node,
  permission: PropTypes.string,
  module: PropTypes.string,
  action: PropTypes.string,
  redirectTo: PropTypes.string,
  requireAuth: PropTypes.bool,
};

export default ProtectedRoute;
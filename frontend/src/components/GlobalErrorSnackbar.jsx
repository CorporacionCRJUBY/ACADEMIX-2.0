// FILE: frontend/src/components/GlobalErrorSnackbar.jsx
import React, { useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

// FIX (auditoria hallazgo medio M4 - errores silenciados): los ~30 ListPages
// solo hacen console.error en su catch, así que un fallo de la API quedaba
// invisible para el usuario. axiosClient despacha el evento 'academix:api-error'
// en cada error no manejado (excepto 401 y peticiones canceladas) y este
// componente, montado una vez en MainLayout y otra en AuthLayout, lo muestra
// en un snackbar con cierre manual.
const GlobalErrorSnackbar = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleApiError = (event) => {
      setMessage(event.detail?.message || '');
      setOpen(true);
    };

    window.addEventListener('academix:api-error', handleApiError);
    return () => window.removeEventListener('academix:api-error', handleApiError);
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity="error" variant="filled" onClose={handleClose} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalErrorSnackbar;

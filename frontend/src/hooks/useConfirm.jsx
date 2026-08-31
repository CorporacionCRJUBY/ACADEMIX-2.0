// FILE: frontend/src/hooks/useConfirm.jsx
// Promise-based replacement for `window.confirm(...)`, rendered as a
// Material UI dialog so confirmations match the app's theme (and are
// translated) instead of using the browser's native, unstyled dialog.
//
// Usage:
//   const [confirm, ConfirmDialog] = useConfirm();
//   const handleDelete = async (id) => {
//     if (await confirm(t('common.confirmDelete'))) {
//       await api.delete(id);
//     }
//   };
//   return (
//     <Box>
//       ...
//       {ConfirmDialog}
//     </Box>
//   );
import { useState, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function useConfirm() {
  const { t } = useTranslation();
  const [state, setState] = useState({ open: false, message: '', resolve: null });

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setState({ open: true, message, resolve });
    });
  }, []);

  const handleClose = (result) => {
    if (state.resolve) state.resolve(result);
    setState((s) => ({ ...s, open: false }));
  };

  const ConfirmDialog = (
    <Dialog open={state.open} onClose={() => handleClose(false)} maxWidth="xs" fullWidth>
      <DialogTitle>{t('common.confirm', { defaultValue: 'Confirm' })}</DialogTitle>
      <DialogContent>
        <DialogContentText>{state.message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleClose(false)}>{t('common.cancel')}</Button>
        <Button onClick={() => handleClose(true)} color="error" variant="contained" autoFocus>
          {t('common.confirm', { defaultValue: 'Confirm' })}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return [confirm, ConfirmDialog];
}

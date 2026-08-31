// FILE: frontend/src/features/settings/pages/SettingFormPage.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Paper, Alert } from '@mui/material';

const SettingFormPage = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={800} className="gradient-text" gutterBottom>
        {t('settings.title')}
      </Typography>

      <Paper sx={{ p: 3, borderTop: '4px solid', borderColor: 'primary.main' }}>
        <Alert severity="info">
          {t('settings.useListPage')}
        </Alert>
      </Paper>
    </Box>
  );
};

export default SettingFormPage;
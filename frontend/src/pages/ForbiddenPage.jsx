// FILE: frontend/src/pages/ForbiddenPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Home as HomeIcon, Lock as LockIcon } from '@mui/icons-material';

const ForbiddenPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 20% 20%, rgba(124,58,237,0.14) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(192,38,211,0.10) 0%, transparent 45%), #0e0618',
      }}
    >
      <Paper sx={{ p: 5, textAlign: 'center', maxWidth: 500, borderRadius: 5 }}>
        <LockIcon sx={{ fontSize: 64, color: 'error.main', mb: 1 }} />
        <Typography variant="h1" component="div" className="gradient-text"
          sx={{ fontSize: 96, fontWeight: 900, opacity: 0.85 }}>
          403
        </Typography>
        <Typography variant="h4" fontWeight={800} className="gradient-text" gutterBottom>
          {t('forbidden.title')}
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          {t('forbidden.message')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/dashboard')}
        >
          {t('forbidden.goHome')}
        </Button>
      </Paper>
    </Box>
  );
};

export default ForbiddenPage;

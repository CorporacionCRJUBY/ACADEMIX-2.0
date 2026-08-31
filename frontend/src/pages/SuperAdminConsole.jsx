// FILE: frontend/src/pages/SuperAdminConsole.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Paper,
  Divider,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  People as UsersIcon,
  Business as BranchesIcon,
  Gavel as RolesIcon,
  Lock as PermissionsIcon,
  Description as AuditIcon,
  Translate as TranslateIcon,
  Backup as BackupIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const SuperAdminConsolePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const adminCards = [
    {
      title: t('admin.branches'),
      icon: <BranchesIcon sx={{ fontSize: 40 }} />,
      description: t('admin.branchesDesc'),
      path: '/branches',
      color: 'linear-gradient(135deg, #7C3AED 0%, #4B1C71 100%)',
    },
    {
      title: t('admin.users'),
      icon: <UsersIcon sx={{ fontSize: 40 }} />,
      description: t('admin.usersDesc'),
      path: '/users',
      color: 'linear-gradient(135deg, #A470D1 0%, #6423C4 100%)',
    },
    {
      title: t('admin.roles'),
      icon: <RolesIcon sx={{ fontSize: 40 }} />,
      description: t('admin.rolesDesc'),
      path: '/roles',
      color: 'linear-gradient(135deg, #D6409F 0%, #7C3AED 100%)',
    },
    {
      title: t('admin.permissions'),
      icon: <PermissionsIcon sx={{ fontSize: 40 }} />,
      description: t('admin.permissionsDesc'),
      path: '/permissions',
      color: 'linear-gradient(135deg, #6423C4 0%, #241035 100%)',
    },
    {
      title: t('admin.settings'),
      icon: <SettingsIcon sx={{ fontSize: 40 }} />,
      description: t('admin.settingsDesc'),
      path: '/settings',
      color: 'linear-gradient(135deg, #9F67FF 0%, #A22D77 100%)',
    },
    {
      title: t('admin.audit'),
      icon: <AuditIcon sx={{ fontSize: 40 }} />,
      description: t('admin.auditDesc'),
      path: '/audit',
      color: 'linear-gradient(135deg, #C3A0E3 0%, #6423C4 100%)',
    },
    {
      title: t('admin.activity'),
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      description: t('admin.activityDesc'),
      path: '/activity',
      color: 'linear-gradient(135deg, #B47AE2 0%, #4B1C71 100%)',
    },
    {
      title: t('admin.translations'),
      icon: <TranslateIcon sx={{ fontSize: 40 }} />,
      description: t('admin.translationsDesc'),
      path: '/translations',
      color: 'linear-gradient(135deg, #E07BC0 0%, #6423C4 100%)',
    },
    {
      title: t('admin.backup'),
      icon: <BackupIcon sx={{ fontSize: 40 }} />,
      description: t('admin.backupDesc'),
      path: '/backup',
      color: 'linear-gradient(135deg, #8B84A0 0%, #4B1C71 100%)',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Paper
        sx={{
          p: 3,
          mb: 3,
          color: 'white',
          backgroundImage: (theme) => theme.academix?.gradientPrimary,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 95% 10%, rgba(255,255,255,0.14) 0%, transparent 45%)',
          }}
        />
        <Typography variant="h4" fontWeight={800} gutterBottom sx={{ position: 'relative' }}>
          {t('admin.console')}
        </Typography>
        <Typography variant="body1" sx={{ position: 'relative' }}>
          {t('admin.welcome')}, {user?.full_name}!
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {adminCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.title}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: (t) => t.academix?.shadowLg },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      backgroundImage: card.color,
                      color: 'white',
                      borderRadius: 2,
                      p: 1,
                      mr: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography variant="h6">{card.title}</Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  {card.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => navigate(card.path)}
                >
                  {t('common.view')}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('admin.systemInfo')}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              {t('admin.version')}
            </Typography>
            <Typography variant="body1">ACADEMIX 2.0</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              {t('admin.environment')}
            </Typography>
            <Typography variant="body1">
              {import.meta.env.MODE || 'development'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              {t('admin.totalUsers')}
            </Typography>
            <Typography variant="body1">-</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              {t('admin.lastBackup')}
            </Typography>
            <Typography variant="body1">-</Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default SuperAdminConsolePage;
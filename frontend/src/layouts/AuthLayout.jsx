// FILE: frontend/src/layouts/AuthLayout.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Stack } from '@mui/material';
import { School as SchoolIcon, InsightsRounded, ShieldOutlined, GroupsRounded } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
// FIX (auditoria hallazgo medio M4): también el layout de auth muestra los
// errores de API (p. ej. fallos de login que no sean el 401 gestionado).
import GlobalErrorSnackbar from '../components/GlobalErrorSnackbar';

const AuthLayout = ({ children, title, subtitle }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const gradient = theme.academix?.gradientPrimary || theme.palette.primary.main;

  // FIX (auditoria hallazgo medio M7): textos del panel de marca ahora en
  // i18n (namespace auth, sección brand) con su versión EN/ES.
  const highlights = [
    { icon: <InsightsRounded />, text: t('auth.brand.highlightReports') },
    { icon: <GroupsRounded />, text: t('auth.brand.highlightManagement') },
    { icon: <ShieldOutlined />, text: t('auth.brand.highlightSecurity') },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        background: theme.palette.background.default,
        p: { xs: 0, md: 3 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          maxWidth: 1080,
          m: 'auto',
          borderRadius: { xs: 0, md: 6 },
          overflow: 'hidden',
          boxShadow: theme.academix?.shadowLg,
          minHeight: { xs: '100vh', md: 620 },
        }}
      >
        {/* Panel de marca */}
        <Box
          sx={{
            flex: 1,
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: 6,
            color: '#fff',
            position: 'relative',
            backgroundImage: gradient,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.14) 0%, transparent 40%), radial-gradient(circle at 85% 90%, rgba(255,255,255,0.10) 0%, transparent 45%)',
            }}
          />
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ position: 'relative' }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: 'rgba(255,255,255,0.16)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)',
              }}
            >
              <SchoolIcon />
            </Box>
            <Typography variant="h6" fontWeight={800} letterSpacing={0.5}>
              ACADEMIX 2.0
            </Typography>
          </Stack>

          <Box sx={{ position: 'relative' }}>
            <Typography variant="h3" fontWeight={800} sx={{ mb: 2, lineHeight: 1.15 }}>
              {t('auth.brand.heading')}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.85, mb: 4, maxWidth: 380 }}>
              {t('auth.brand.description')}
            </Typography>
            <Stack spacing={2}>
              {highlights.map((h) => (
                <Stack key={h.text} direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255,255,255,0.16)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      '& svg': { fontSize: 18 },
                    }}
                  >
                    {h.icon}
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {h.text}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          <Typography variant="caption" sx={{ opacity: 0.6, position: 'relative' }}>
            {t('auth.brand.rights', { year: new Date().getFullYear() })}
          </Typography>
        </Box>

        {/* Panel de formulario */}
        <Box
          sx={{
            flex: 1,
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 4, sm: 6 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 380 }}>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ mb: 4, display: { xs: 'flex', md: 'none' } }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  backgroundImage: gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <SchoolIcon fontSize="small" />
              </Box>
              <Typography variant="h6" fontWeight={800} color="primary.dark">
                ACADEMIX
              </Typography>
            </Stack>

            <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {subtitle}
              </Typography>
            )}
            {children}
          </Box>
        </Box>
      </Box>

      {/* FIX (auditoria hallazgo medio M4): una sola instancia por layout */}
      <GlobalErrorSnackbar />
    </Box>
  );
};

AuthLayout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};

export default AuthLayout;

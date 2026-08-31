// FILE: frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import AuthLayout from '../layouts/AuthLayout';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, verifyTwoFactor } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // FIX (auditoria hallazgo bajo B6): el estado rememberMe y su checkbox eran
  // código muerto (nunca se enviaban al backend), así que se eliminaron.
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // FIX (auditoria hallazgo bajo #2 - falta de 2FA): si la cuenta tiene el
  // segundo factor activo, login() no abre sesión — devuelve un
  // challengeToken que se guarda acá para el segundo formulario (código
  // TOTP/de respaldo), ver handleTwoFactorSubmit.
  const [challengeToken, setChallengeToken] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate(from, { replace: true });
      } else if (result.twoFactorRequired) {
        setChallengeToken(result.challengeToken);
      } else {
        setError(result.error || t('auth.loginError'));
      }
    } catch (err) {
      setError(err.message || t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await verifyTwoFactor(challengeToken, twoFactorCode.trim());
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error || t('auth.twoFactor.invalidCode'));
      }
    } catch (err) {
      setError(err.message || t('auth.twoFactor.invalidCode'));
    } finally {
      setLoading(false);
    }
  };

  if (challengeToken) {
    return (
      <AuthLayout title={t('auth.twoFactor.title')} subtitle={t('auth.twoFactor.subtitle')}>
        <Box component="form" onSubmit={handleTwoFactorSubmit} sx={{ mt: 1, width: '100%' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            autoFocus
            label={t('auth.twoFactor.codeLabel')}
            helperText={t('auth.twoFactor.codeHelper')}
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 9, autoComplete: 'one-time-code' } }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading || !twoFactorCode.trim()}
            size="large"
            sx={{ mt: 3, mb: 1, py: 1.3, fontSize: '0.95rem' }}
          >
            {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : t('auth.twoFactor.verify')}
          </Button>

          <Button
            fullWidth
            variant="text"
            sx={{ textTransform: 'none' }}
            onClick={() => {
              setChallengeToken(null);
              setTwoFactorCode('');
              setError(null);
            }}
          >
            {t('auth.twoFactor.backToLogin')}
          </Button>
        </Box>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t('auth.welcome')} subtitle={t('auth.loginSubtitle')}>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          margin="normal"
          required
          fullWidth
          label={t('auth.email')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          slotProps={{ input: {
            startAdornment: (
              <InputAdornment position="start">
                <Email />
              </InputAdornment>
            ),
          } }}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          label={t('auth.password')}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          slotProps={{ input: {
            startAdornment: (
              <InputAdornment position="start">
                <Lock />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          } }}
        />

        {/* FIX (auditoria hallazgo medio M1): el enlace "forgot password"
            navegaba a /forgot-password, ruta que no existe en App.jsx. La
            función de recuperación de contraseña no está implementada, así
            que se eliminó el botón (junto con el checkbox rememberMe del
            hallazgo B6, que era código muerto). */}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          size="large"
          sx={{ mt: 3, mb: 2, py: 1.3, fontSize: '0.95rem' }}
        >
          {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : t('auth.login')}
        </Button>
      </Box>
    </AuthLayout>
  );
};

export default LoginPage;
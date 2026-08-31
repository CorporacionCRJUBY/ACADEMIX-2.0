// FILE: frontend/src/features/audit/pages/AuditFormPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Divider,
} from '@mui/material';
import auditApi from '../api';

const AuditFormPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await auditApi.getById(id);
      // `api.get` unwraps axios' response.data, so `response` here is the
      // `{ success, data }` envelope from the backend — read `.data`, not the envelope.
      setData(response?.data || response);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">{t('audit.notFound')}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={800} className="gradient-text" gutterBottom>
        {t('audit.details')}
      </Typography>

      <Paper sx={{ p: 3, borderTop: '4px solid', borderColor: 'primary.main' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              {t('audit.user')}
            </Typography>
            <Typography variant="body1">{data.user_name || data.user_id}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              {t('audit.action')}
            </Typography>
            <Chip label={data.action} color="primary" size="small" />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              {t('audit.module')}
            </Typography>
            <Typography variant="body1">{data.module}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              {t('audit.record')}
            </Typography>
            <Typography variant="body1">{data.record_code || '-'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="textSecondary">
              {t('audit.before')}
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'rgba(255,255,255,0.04)' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {data.before ? JSON.stringify(data.before, null, 2) : '-'}
              </pre>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">
              {t('audit.after')}
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'rgba(255,255,255,0.04)' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {data.after ? JSON.stringify(data.after, null, 2) : '-'}
              </pre>
            </Paper>
          </Grid>
          {data.reason && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">
                {t('audit.reason')}
              </Typography>
              <Typography variant="body1">{data.reason}</Typography>
            </Grid>
          )}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              {t('audit.date')}
            </Typography>
            <Typography variant="body1">
              {new Date(data.created_at).toLocaleString()}
            </Typography>
          </Grid>
          {data.ip && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                {t('audit.ip')}
              </Typography>
              <Typography variant="body1">{data.ip}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default AuditFormPage;
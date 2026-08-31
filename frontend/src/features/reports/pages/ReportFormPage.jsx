// FILE: frontend/src/features/reports/pages/ReportFormPage.jsx
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
  Button,
} from '@mui/material';
import PdfIcon from '@mui/icons-material/PictureAsPdf';
import reportsApi from '../api';

const ReportFormPage = () => {
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
      const response = await reportsApi.getById(id);
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
        <Alert severity="warning">{t('reports.notFound')}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={800} className="gradient-text" gutterBottom>
        {t('reports.details')}
      </Typography>

      <Paper sx={{ p: 3, borderTop: '4px solid', borderColor: 'primary.main' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              {t('reports.code')}
            </Typography>
            <Typography variant="body1">{data.code}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              {t('reports.category')}
            </Typography>
            <Chip label={data.category} color="primary" size="small" />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              {t('reports.student')}
            </Typography>
            <Typography variant="body1">{data.student_name || data.student_id}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              {t('reports.status')}
            </Typography>
            <Chip label={data.status} color={data.status === 'OFFICIAL' ? 'success' : 'default'} size="small" />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              {t('reports.version')}
            </Typography>
            <Typography variant="body1">v{data.version_number}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              {t('reports.date')}
            </Typography>
            <Typography variant="body1">
              {data.report_date ? new Date(data.report_date).toLocaleDateString() : '-'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="textSecondary">
              {t('reports.notes')}
            </Typography>
            <Typography variant="body1">{data.notes || '-'}</Typography>
          </Grid>
          {data.has_pdf && (
            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<PdfIcon />}
                onClick={async () => {
                  // pdf_url ya no existe como URL pública (ver backend/src/app.js);
                  // se pide el PDF con el token y se abre el blob resultante.
                  try {
                    const blobUrl = await reportsApi.getPreviewBlobUrl(id);
                    window.open(blobUrl, '_blank');
                  } catch (err) {
                    console.error('[Reports] preview failed', err);
                  }
                }}
              >
                {t('reports.viewPdf')}
              </Button>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default ReportFormPage;
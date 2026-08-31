// FILE: frontend/src/features/academicPeriods/pages/AcademicPeriodFormPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  MenuItem,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import academicPeriodsApi from '../api';
import academicYearsApi from '../../academicYears/api';

const emptyForm = {
  academic_year_id: '',
  name: '',
  start_date: '',
  end_date: '',
  status: 'OPEN',
};

const AcademicPeriodFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [formData, setFormData] = useState(emptyForm);

  const isLocked = isEdit && formData.status === 'LOCKED';

  useEffect(() => {
    loadOptions();
    if (isEdit) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadOptions = async () => {
    try {
      const response = await academicYearsApi.getAll();
      setAcademicYears(response?.data?.data || response?.data || []);
    } catch (err) {
      console.error('Error loading academic years:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await academicPeriodsApi.getById(id);
      // `api.get` unwraps axios' response.data, so `response` here is the
      // `{ success, data }` envelope from the backend — read `.data`, not the envelope.
      const record = response?.data || response;
      setFormData({
        ...emptyForm,
        ...record,
        start_date: record.start_date ? record.start_date.substring(0, 10) : '',
        end_date: record.end_date ? record.end_date.substring(0, 10) : '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (isEdit) {
        await academicPeriodsApi.update(id, formData);
      } else {
        await academicPeriodsApi.create(formData);
      }
      navigate('/academic-periods');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={800} className="gradient-text" gutterBottom>
        {isEdit ? t('academicPeriods.edit') : t('academicPeriods.add')}
      </Typography>

      <Paper sx={{ p: 3, borderTop: '4px solid', borderColor: 'primary.main' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {isLocked && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('academicPeriods.lockedNotice')}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <fieldset disabled={isLocked} style={{ border: 0, padding: 0, margin: 0 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('academicPeriods.name')}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t('academicPeriods.year')}</InputLabel>
                  <Select
                    name="academic_year_id"
                    value={formData.academic_year_id || ''}
                    onChange={handleChange}
                    label={t('academicPeriods.year')}
                  >
                    {academicYears.map((y) => (
                      <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('academicPeriods.status')}</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    label={t('academicPeriods.status')}
                  >
                    <MenuItem value="OPEN">{t('status.open')}</MenuItem>
                    <MenuItem value="CLOSED">{t('status.closed')}</MenuItem>
                    <MenuItem value="LOCKED" disabled>{t('status.locked')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('academicPeriods.startDate')}
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('academicPeriods.endDate')}
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={24} /> : t('common.save')}
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => navigate('/academic-periods')}
              >
                {t('common.cancel')}
              </Button>
            </Box>
          </fieldset>
        </form>
      </Paper>
    </Box>
  );
};

export default AcademicPeriodFormPage;

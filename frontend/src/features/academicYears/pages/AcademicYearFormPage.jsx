// FILE: frontend/src/features/academicYears/pages/AcademicYearFormPage.jsx
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
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import academicYearsApi from '../api';

const emptyForm = {
  name: '',
  start_date: '',
  end_date: '',
  status: 'ACTIVE',
  is_active: false,
};

const AcademicYearFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await academicYearsApi.getById(id);
      // `api.get` unwraps axios' response.data, so `response` here is the
      // `{ success, data }` envelope from the backend — read `.data`, not the envelope.
      const record = response?.data || response;
      setFormData({
        ...emptyForm,
        ...record,
        start_date: record.start_date ? record.start_date.substring(0, 10) : '',
        end_date: record.end_date ? record.end_date.substring(0, 10) : '',
        // MySQL returns TINYINT(1) as 0/1, not a real boolean — coerce it so
        // the Switch reflects exactly what was saved instead of a stray warning.
        is_active: Boolean(record.is_active),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (isEdit) {
        await academicYearsApi.update(id, formData);
      } else {
        await academicYearsApi.create(formData);
      }
      navigate('/academic-years');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setConfirmDeleteOpen(false);
    try {
      await academicYearsApi.delete(id);
      navigate('/academic-years');
    } catch (err) {
      setError(err.message);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={800} className="gradient-text">
          {isEdit ? t('academicYears.edit') : t('academicYears.add')}
        </Typography>
        {isEdit && (
          <Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={() => setConfirmDeleteOpen(true)}>
            {t('common.delete')}
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 3, borderTop: '4px solid', borderColor: 'primary.main' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('academicYears.name')}
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('academicYears.startDate')}
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
                label={t('academicYears.endDate')}
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{t('academicYears.status')}</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label={t('academicYears.status')}
                >
                  <MenuItem value="ACTIVE">{t('status.active')}</MenuItem>
                  <MenuItem value="INACTIVE">{t('status.inactive')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                }
                label={t('academicYears.active')}
              />
              <Typography variant="caption" color="textSecondary" display="block">
                {t('academicYears.activeHelp')}
              </Typography>
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
              onClick={() => navigate('/academic-years')}
            >
              {t('common.cancel')}
            </Button>
          </Box>
        </form>
      </Paper>

      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>{t('common.confirmDelete')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('academicYears.confirmDeleteAcademicYear')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AcademicYearFormPage;

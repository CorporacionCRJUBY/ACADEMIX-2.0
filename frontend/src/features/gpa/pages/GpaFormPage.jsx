// FILE: frontend/src/features/gpa/pages/GpaFormPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useConfirm from '../../../hooks/useConfirm';
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
  Divider,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon, Delete as DeleteIcon } from '@mui/icons-material';
import gpaApi from '../api';
import studentsApi from '../../students/api';
import academicPeriodsApi from '../../academicPeriods/api';
import academicYearsApi from '../../academicYears/api';

const emptyForm = {
  student_id: '',
  academic_period_id: '',
  academic_year_id: '',
  gpa_value: '',
  cumulative_gpa: '',
  credit_hours: '',
  status: 'PENDING',
};

const GpaFormPage = () => {
  const { t } = useTranslation();
  const [confirm, ConfirmDialog] = useConfirm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [academicPeriods, setAcademicPeriods] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    loadOptions();
    if (isEdit) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadOptions = async () => {
    try {
      const [studentsRes, periodsRes, yearsRes] = await Promise.all([
        studentsApi.getAll({ pageSize: 1000 }),
        academicPeriodsApi.getAll({ pageSize: 1000 }),
        academicYearsApi.getAll({ pageSize: 1000 }),
      ]);
      setStudents(studentsRes?.data || []);
      setAcademicPeriods(periodsRes?.data?.data || periodsRes?.data || []);
      setAcademicYears(yearsRes?.data?.data || yearsRes?.data || []);
    } catch (err) {
      console.error('Error loading form options:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await gpaApi.getById(id);
      // `api.get` unwraps axios' response.data, so `response` here is the
      // `{ success, data }` envelope from the backend — read `.data`, not the envelope.
      const record = response?.data || response;
      setFormData({ ...emptyForm, ...record });
    } catch (error) {
      setError(error.message);
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
        await gpaApi.update(id, formData);
      } else {
        await gpaApi.create(formData);
      }
      navigate('/gpa');
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (await confirm(t('gpa.confirmDeleteGpa'))) {
      try {
        await gpaApi.delete(id);
        navigate('/gpa');
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const sectionTitleSx = { color: '#4B1C71', fontWeight: 700, mb: 2 };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={800} className="gradient-text">
          {isEdit ? t('gpa.edit') : t('gpa.add')}
        </Typography>
        {isEdit && (
          <Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={handleDelete}>
            {t('common.delete')}
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Paper sx={{ p: 3, borderTop: '4px solid', borderColor: 'primary.main' }}>
          <Typography variant="h6" sx={sectionTitleSx}>{t('gpa.generalInfo')}</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>{t('gpa.student')}</InputLabel>
                <Select name="student_id" value={formData.student_id || ''} onChange={handleChange} label={t('gpa.student')}>
                  {students.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>{t('gpa.period')}</InputLabel>
                <Select name="academic_period_id" value={formData.academic_period_id || ''} onChange={handleChange} label={t('gpa.period')}>
                  {academicPeriods.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>{t('gpa.year')}</InputLabel>
                <Select name="academic_year_id" value={formData.academic_year_id || ''} onChange={handleChange} label={t('gpa.year')}>
                  {academicYears.map((y) => (
                    <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('gpa.value')}
                name="gpa_value"
                type="number"
                step="0.001"
                value={formData.gpa_value}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('gpa.cumulative')}
                name="cumulative_gpa"
                type="number"
                step="0.001"
                value={formData.cumulative_gpa}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('gpa.credits')}
                name="credit_hours"
                type="number"
                step="0.01"
                value={formData.credit_hours}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{t('gpa.status')}</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label={t('gpa.status')}
                >
                  <MenuItem value="PENDING">{t('status.pending')}</MenuItem>
                  <MenuItem value="APPROVED">{t('status.approved')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

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
            onClick={() => navigate('/gpa')}
          >
            {t('common.cancel')}
          </Button>
        </Box>
      </form>
      {ConfirmDialog}
    </Box>
  );
};

export default GpaFormPage;
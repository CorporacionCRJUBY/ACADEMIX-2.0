// FILE: frontend/src/features/progressReports/pages/ProgressReportFormPage.jsx
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
  Divider,
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
import progressReportsApi from '../api';
import studentsApi from '../../students/api';
import academicPeriodsApi from '../../academicPeriods/api';
import academicYearsApi from '../../academicYears/api';

const emptyForm = {
  student_id: '',
  academic_period_id: '',
  academic_year_id: '',
  report_date: '',
  status: 'DRAFT',
  notes: '',
};

const ProgressReportFormPage = () => {
  const { t } = useTranslation();
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
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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
      setStudents(studentsRes?.data?.data || studentsRes?.data || []);
      setAcademicPeriods(periodsRes?.data?.data || periodsRes?.data || []);
      setAcademicYears(yearsRes?.data?.data || yearsRes?.data || []);
    } catch (err) {
      console.error('Error loading form options:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await progressReportsApi.getById(id);
      // `api.get` unwraps axios' response.data, so `response` here is the
      // `{ success, data }` envelope from the backend — read `.data`, not the envelope.
      const record = response?.data || response;
      setFormData({ ...emptyForm, ...record });
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
        await progressReportsApi.update(id, formData);
      } else {
        await progressReportsApi.create(formData);
      }
      navigate('/progress-reports');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setConfirmDeleteOpen(false);
    try {
      await progressReportsApi.delete(id);
      navigate('/progress-reports');
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

  const sectionTitleSx = { color: '#4B1C71', fontWeight: 700, mb: 2 };
  // Once generated, a report's status changes only through the "Generate" /
  // "Archive" actions on the list — never by editing this field directly —
  // so we never silently overwrite an official document (per system rules).
  const canDelete = isEdit && formData.status === 'DRAFT';

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={800} className="gradient-text">
          {isEdit ? t('progressReports.edit') : t('progressReports.add')}
        </Typography>
        {canDelete && (
          <Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={() => setConfirmDeleteOpen(true)}>
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
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderTop: '4px solid', borderColor: 'primary.main' }}>
              <Typography variant="h6" sx={sectionTitleSx}>{t('progressReports.generalInfo')}</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>{t('progressReports.student')}</InputLabel>
                    <Select name="student_id" value={formData.student_id || ''} onChange={handleChange} label={t('progressReports.student')}>
                      {students.map((s) => (
                        <MenuItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('progressReports.date')}
                    name="report_date"
                    type="date"
                    value={formData.report_date || ''}
                    onChange={handleChange}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>{t('progressReports.period')}</InputLabel>
                    <Select name="academic_period_id" value={formData.academic_period_id || ''} onChange={handleChange} label={t('progressReports.period')}>
                      {academicPeriods.map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>{t('progressReports.year')}</InputLabel>
                    <Select name="academic_year_id" value={formData.academic_year_id || ''} onChange={handleChange} label={t('progressReports.year')}>
                      {academicYears.map((y) => (
                        <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={isEdit}>
                    <InputLabel>{t('progressReports.status')}</InputLabel>
                    <Select name="status" value={formData.status} onChange={handleChange} label={t('progressReports.status')}>
                      <MenuItem value="DRAFT">{t('status.draft')}</MenuItem>
                      <MenuItem value="OFFICIAL">{t('status.official')}</MenuItem>
                      <MenuItem value="ARCHIVED">{t('status.archived')}</MenuItem>
                    </Select>
                    {isEdit && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5 }}>
                        {t('progressReports.statusHint')}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('progressReports.notes')}
                    name="notes"
                    multiline
                    rows={3}
                    value={formData.notes || ''}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : t('common.save')}
          </Button>
          <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => navigate('/progress-reports')}>
            {t('common.cancel')}
          </Button>
        </Box>
      </form>

      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>{t('common.confirmDelete')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('progressReports.confirmDeleteReport')}</DialogContentText>
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

export default ProgressReportFormPage;

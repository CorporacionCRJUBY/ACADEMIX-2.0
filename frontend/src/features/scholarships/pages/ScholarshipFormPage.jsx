// FILE: frontend/src/features/scholarships/pages/ScholarshipFormPage.jsx
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
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon, Delete as DeleteIcon } from '@mui/icons-material';
import scholarshipsApi from '../api';
import studentsApi from '../../students/api';
import academicYearsApi from '../../academicYears/api';

const SCHOLARSHIP_TYPES = ['Académica', 'Deportiva', 'Cultural', 'Necesidad'];

const emptyForm = {
  student_id: '',
  scholarship_type: '',
  percentage: '',
  amount: '',
  academic_year_id: '',
  start_date: '',
  end_date: '',
  status: 'REQUESTED',
  notes: '',
};

const ScholarshipFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [confirm, ConfirmDialog] = useConfirm();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
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
      const [studentsRes, yearsRes] = await Promise.all([
        studentsApi.getAll({ pageSize: 1000 }),
        academicYearsApi.getAll({ pageSize: 1000 }),
      ]);
      setStudents(studentsRes?.data || []);
      setAcademicYears(yearsRes?.data?.data || yearsRes?.data || []);
    } catch (err) {
      console.error('Error loading form options:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await scholarshipsApi.getById(id);
      // `api.get` unwraps axios' response.data, so `response` here is the
      // `{ success, data }` envelope from the backend — read `.data`, not the envelope.
      const record = response?.data || response;
      setFormData({
        ...emptyForm,
        ...record,
        start_date: record.start_date ? record.start_date.substring(0, 10) : '',
        end_date: record.end_date ? record.end_date.substring(0, 10) : '',
      });
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
        await scholarshipsApi.update(id, formData);
      } else {
        await scholarshipsApi.create(formData);
      }
      navigate('/scholarships');
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (await confirm(t('scholarships.confirmDeleteScholarship', { defaultValue: 'Delete this scholarship?' }))) {
      try {
        await scholarshipsApi.delete(id);
        navigate('/scholarships');
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight={800} className="gradient-text">
          {isEdit ? t('scholarships.edit') : t('scholarships.add')}
        </Typography>
        {isEdit && (
          <Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={handleDelete}>
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
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>{t('scholarships.student')}</InputLabel>
                <Select
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleChange}
                  label={t('scholarships.student')}
                >
                  {students.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>{t('scholarships.type')}</InputLabel>
                <Select
                  name="scholarship_type"
                  value={formData.scholarship_type}
                  onChange={handleChange}
                  label={t('scholarships.type')}
                >
                  {SCHOLARSHIP_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {t(`scholarships.${type === 'Académica' ? 'academic' : type === 'Deportiva' ? 'sports' : type === 'Cultural' ? 'cultural' : 'need'}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('scholarships.percentage')}
                name="percentage"
                type="number"
                inputProps={{ step: '0.01', min: 0, max: 100 }}
                value={formData.percentage}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('scholarships.amount')}
                name="amount"
                type="number"
                inputProps={{ step: '0.01', min: 0 }}
                value={formData.amount}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>{t('scholarships.year')}</InputLabel>
                <Select
                  name="academic_year_id"
                  value={formData.academic_year_id}
                  onChange={handleChange}
                  label={t('scholarships.year')}
                >
                  {academicYears.map((y) => (
                    <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{t('scholarships.status')}</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label={t('scholarships.status')}
                  disabled={isEdit}
                >
                  <MenuItem value="REQUESTED">{t('scholarships.requested')}</MenuItem>
                  <MenuItem value="UNDER_REVIEW">{t('scholarships.underReview')}</MenuItem>
                  <MenuItem value="APPROVED">{t('scholarships.approved')}</MenuItem>
                  <MenuItem value="REJECTED">{t('scholarships.rejected')}</MenuItem>
                  <MenuItem value="ACTIVE">{t('scholarships.active')}</MenuItem>
                  <MenuItem value="SUSPENDED">{t('scholarships.suspended')}</MenuItem>
                  <MenuItem value="EXPIRED">{t('scholarships.expired')}</MenuItem>
                  <MenuItem value="CANCELLED">{t('scholarships.cancelled')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('scholarships.startDate')}
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
                label={t('scholarships.endDate')}
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('scholarships.notes')}
                name="notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleChange}
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
              onClick={() => navigate('/scholarships')}
            >
              {t('common.cancel')}
            </Button>
          </Box>
        </form>
      </Paper>
      {ConfirmDialog}
    </Box>
  );
};

export default ScholarshipFormPage;

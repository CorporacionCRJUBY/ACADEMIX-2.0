// FILE: frontend/src/features/gransif/pages/GransifFormPage.jsx
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
import gransifApi from '../api';
import studentsApi from '../../students/api';
import academicYearsApi from '../../academicYears/api';

const GransifFormPage = () => {
  const { t } = useTranslation();
  const [confirm, ConfirmDialog] = useConfirm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [formData, setFormData] = useState({
    student_id: '',
    academic_year_id: '',
    assessment_date: '',
    score: '',
    status: 'PENDING',
    notes: '',
  });

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
      const response = await gransifApi.getById(id);
      // `api.get` unwraps axios' response.data, so `response` here is the
      // `{ success, data }` envelope from the backend — read `.data`, not the envelope.
      const record = response?.data || response;
      setFormData((prev) => ({
        ...prev,
        ...record,
        assessment_date: record.assessment_date ? record.assessment_date.substring(0, 10) : '',
      }));
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
        await gransifApi.update(id, formData);
      } else {
        await gransifApi.create(formData);
      }
      navigate('/gransif');
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (await confirm(t('gransif.confirmDeleteRecord'))) {
      try {
        await gransifApi.delete(id);
        navigate('/gransif');
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
          {isEdit ? t('gransif.edit') : t('gransif.add')}
        </Typography>
        {isEdit && (
          <Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={handleDelete}>
            {t('common.delete')}
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 3, borderTop: '4px solid', borderColor: 'primary.main' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>{t('gransif.student')}</InputLabel>
                <Select name="student_id" value={formData.student_id || ''} onChange={handleChange} label={t('gransif.student')}>
                  {students.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>{t('gransif.year')}</InputLabel>
                <Select name="academic_year_id" value={formData.academic_year_id || ''} onChange={handleChange} label={t('gransif.year')}>
                  {academicYears.map((y) => (
                    <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('gransif.date')}
                name="assessment_date"
                type="date"
                value={formData.assessment_date}
                onChange={handleChange}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('gransif.score')}
                name="score"
                type="number"
                step="0.01"
                value={formData.score}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>{t('gransif.status')}</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label={t('gransif.status')}
                >
                  <MenuItem value="PENDING">{t('status.pending')}</MenuItem>
                  <MenuItem value="ACTIVE">{t('status.active')}</MenuItem>
                  <MenuItem value="COMPLETED">{t('status.completed')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('gransif.notes')}
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
              onClick={() => navigate('/gransif')}
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

export default GransifFormPage;
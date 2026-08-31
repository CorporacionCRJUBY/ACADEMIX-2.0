// FILE: frontend/src/features/calendar/pages/CalendarFormPage.jsx
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
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon, Delete as DeleteIcon } from '@mui/icons-material';
import calendarApi from '../api';
import branchesApi from '../../branches/api';
import academicYearsApi from '../../academicYears/api';

const CalendarFormPage = () => {
  const { t } = useTranslation();
  const [confirm, ConfirmDialog] = useConfirm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [branches, setBranches] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [formData, setFormData] = useState({
    branch_id: '',
    academic_year_id: '',
    date: '',
    title: '',
    description: '',
    event_type: 'EVENT',
    is_holiday: false,
    is_working_day: true,
    status: 'ACTIVE',
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
      const [branchesRes, yearsRes] = await Promise.all([
        branchesApi.getAll({ pageSize: 1000 }),
        academicYearsApi.getAll({ pageSize: 1000 }),
      ]);
      setBranches(branchesRes?.data?.data || branchesRes?.data || []);
      setAcademicYears(yearsRes?.data?.data || yearsRes?.data || []);
    } catch (err) {
      console.error('Error loading form options:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await calendarApi.getById(id);
      // `api.get` unwraps axios' response.data, so `response` here is the
      // `{ success, data }` envelope from the backend — read `.data`, not the envelope.
      const record = response?.data || response;
      setFormData((prev) => ({
        ...prev,
        ...record,
        date: record.date ? record.date.substring(0, 10) : '',
        branch_id: record.branch_id || '',
        academic_year_id: record.academic_year_id || '',
      }));
    } catch (error) {
      setError(error.message);
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
      // branch_id and academic_year_id are optional/nullable — send null
      // instead of an empty string so the backend validator (which now
      // accepts null via checkFalsy) doesn't reject an unselected value.
      const payload = {
        ...formData,
        branch_id: formData.branch_id || null,
        academic_year_id: formData.academic_year_id || null,
      };
      if (isEdit) {
        await calendarApi.update(id, payload);
      } else {
        await calendarApi.create(payload);
      }
      navigate('/calendar');
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (await confirm(t('calendar.confirmDeleteRecord'))) {
      try {
        await calendarApi.delete(id);
        navigate('/calendar');
      } catch (err) {
        setError(err.response?.data?.message || err.message);
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
          {isEdit ? t('calendar.edit') : t('calendar.add')}
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('calendar.title')}
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('calendar.date')}
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{t('calendar.eventType')}</InputLabel>
                <Select
                  name="event_type"
                  value={formData.event_type}
                  onChange={handleChange}
                  label={t('calendar.eventType')}
                >
                  <MenuItem value="HOLIDAY">{t('calendar.holiday')}</MenuItem>
                  <MenuItem value="EXAM">{t('calendar.exam')}</MenuItem>
                  <MenuItem value="EVENT">{t('calendar.event')}</MenuItem>
                  <MenuItem value="MEETING">{t('calendar.meeting')}</MenuItem>
                  <MenuItem value="DEADLINE">{t('calendar.deadline')}</MenuItem>
                  <MenuItem value="OTHER">{t('calendar.other')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{t('calendar.branch')}</InputLabel>
                <Select name="branch_id" value={formData.branch_id || ''} onChange={handleChange} label={t('calendar.branch')}>
                  <MenuItem value=""><em>{t('common.none')}</em></MenuItem>
                  {branches.map((b) => (
                    <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{t('calendar.academicYear')}</InputLabel>
                <Select name="academic_year_id" value={formData.academic_year_id || ''} onChange={handleChange} label={t('calendar.academicYear')}>
                  <MenuItem value=""><em>{t('common.none')}</em></MenuItem>
                  {academicYears.map((y) => (
                    <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    name="is_holiday"
                    checked={formData.is_holiday}
                    onChange={handleChange}
                  />
                }
                label={t('calendar.isHoliday')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    name="is_working_day"
                    checked={formData.is_working_day}
                    onChange={handleChange}
                  />
                }
                label={t('calendar.isWorkingDay')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('calendar.description')}
                name="description"
                multiline
                rows={3}
                value={formData.description}
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
              onClick={() => navigate('/calendar')}
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

export default CalendarFormPage;

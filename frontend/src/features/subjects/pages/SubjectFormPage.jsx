// FILE: frontend/src/features/subjects/pages/SubjectFormPage.jsx
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
import subjectsApi from '../api';
import branchesApi from '../../branches/api';

// Grade levels used consistently across Students, Subjects and Assignments
// (elementary grade naming, matching the seeded data and the rest of the system).
const GRADE_OPTIONS = ['1ro', '2do', '3ro', '4to', '5to', '6to'];

const emptyForm = {
  name: '',
  description: '',
  grade: '',
  branch_id: '',
  credits: '',
  hours_per_week: '',
  status: 'ACTIVE',
};

const SubjectFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [branches, setBranches] = useState([]);
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
      const response = await branchesApi.getAll();
      setBranches(response?.data?.data || response?.data || []);
    } catch (err) {
      console.error('Error loading branches:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await subjectsApi.getById(id);
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
        await subjectsApi.update(id, formData);
      } else {
        await subjectsApi.create(formData);
      }
      navigate('/subjects');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setConfirmDeleteOpen(false);
    try {
      await subjectsApi.delete(id);
      navigate('/subjects');
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={800} className="gradient-text">
          {isEdit ? t('subjects.edit') : t('subjects.add')}
        </Typography>
        {isEdit && (
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
          {/* General Information */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderTop: '4px solid', borderColor: 'primary.main' }}>
              <Typography variant="h6" sx={sectionTitleSx}>{t('subjects.generalInfo')}</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth required label={t('subjects.name')} name="name" value={formData.name} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label={t('subjects.description')} name="description" value={formData.description || ''} onChange={handleChange} />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Academic Information */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderTop: '4px solid', borderColor: 'primary.main' }}>
              <Typography variant="h6" sx={sectionTitleSx}>{t('subjects.academicInfo')}</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth required>
                    <InputLabel>{t('subjects.grade')}</InputLabel>
                    <Select name="grade" value={formData.grade || ''} onChange={handleChange} label={t('subjects.grade')}>
                      {GRADE_OPTIONS.map((g) => (
                        <MenuItem key={g} value={g}>{g}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth required>
                    <InputLabel>{t('subjects.branch')}</InputLabel>
                    <Select name="branch_id" value={formData.branch_id || ''} onChange={handleChange} label={t('subjects.branch')}>
                      {branches.map((b) => (
                        <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField fullWidth label={t('subjects.credits')} name="credits" type="number" inputProps={{ step: '0.01' }} value={formData.credits} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField fullWidth label={t('subjects.hours')} name="hours_per_week" type="number" value={formData.hours_per_week} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>{t('subjects.status')}</InputLabel>
                    <Select name="status" value={formData.status} onChange={handleChange} label={t('subjects.status')}>
                      <MenuItem value="ACTIVE">{t('status.active')}</MenuItem>
                      <MenuItem value="INACTIVE">{t('status.inactive')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : t('common.save')}
          </Button>
          <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => navigate('/subjects')}>
            {t('common.cancel')}
          </Button>
        </Box>
      </form>

      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>{t('common.confirmDelete')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('subjects.confirmDeleteSubject')}</DialogContentText>
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

export default SubjectFormPage;

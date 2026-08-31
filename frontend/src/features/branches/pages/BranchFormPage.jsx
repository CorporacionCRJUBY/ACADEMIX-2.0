// FILE: frontend/src/features/branches/pages/BranchFormPage.jsx
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
import branchesApi from '../api';

const emptyForm = {
  name: '',
  address: '',
  phone: '',
  email: '',
  status: 'ACTIVE',
};

const BranchFormPage = () => {
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
      const response = await branchesApi.getById(id);
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
        await branchesApi.update(id, formData);
      } else {
        await branchesApi.create(formData);
      }
      navigate('/branches');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setConfirmDeleteOpen(false);
    try {
      await branchesApi.delete(id);
      navigate('/branches');
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
          {isEdit ? t('branches.edit') : t('branches.add')}
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
                label={t('branches.name')}
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('branches.address')}
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('branches.phone')}
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('branches.email')}
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>{t('branches.status')}</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label={t('branches.status')}
                >
                  <MenuItem value="ACTIVE">{t('status.active')}</MenuItem>
                  <MenuItem value="INACTIVE">{t('status.inactive')}</MenuItem>
                </Select>
              </FormControl>
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
              onClick={() => navigate('/branches')}
            >
              {t('common.cancel')}
            </Button>
          </Box>
        </form>
      </Paper>

      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>{t('common.confirmDelete')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('branches.confirmDeleteBranch')}</DialogContentText>
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

export default BranchFormPage;

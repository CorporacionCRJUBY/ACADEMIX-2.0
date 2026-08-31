// FILE: frontend/src/features/roles/pages/RoleFormPage.jsx
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
  Chip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import rolesApi from '../api';

const RoleFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (isEdit) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await rolesApi.getById(id);
      // `api.get` unwraps axios' response.data, so `response` here is the
      // `{ success, data }` envelope from the backend — read `.data`, not the envelope.
      const record = response?.data || response;
      setFormData((prev) => ({ ...prev, ...record }));
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
        await rolesApi.update(id, formData);
      } else {
        await rolesApi.create(formData);
      }
      navigate('/roles');
    } catch (error) {
      setError(error.message);
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

  const isSuperAdmin = formData.name === 'SUPER_ADMIN';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={800} className="gradient-text" gutterBottom>
        {isEdit ? t('roles.edit') : t('roles.add')}
      </Typography>

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
                label={t('roles.name')}
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isSuperAdmin}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('roles.description')}
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>{t('roles.status')}</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label={t('roles.status')}
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
              disabled={submitting || isSuperAdmin}
            >
              {submitting ? <CircularProgress size={24} /> : t('common.save')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => navigate('/roles')}
            >
              {t('common.cancel')}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default RoleFormPage;
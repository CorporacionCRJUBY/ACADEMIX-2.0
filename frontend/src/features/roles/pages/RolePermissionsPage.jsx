// FILE: frontend/src/features/roles/pages/RolePermissionsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import rolesApi from '../api';
import permissionsApi from '../../permissions/api';

const RolePermissionsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [role, setRole] = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [roleRes, catalogRes, assignedRes] = await Promise.all([
        rolesApi.getById(id),
        permissionsApi.getAll({ pageSize: 1000 }),
        rolesApi.getPermissions(id),
      ]);
      const roleRecord = roleRes?.data || roleRes;
      const catalog = catalogRes?.data?.data || catalogRes?.data || [];
      const assigned = assignedRes?.data || assignedRes || [];

      setRole(roleRecord);
      setAllPermissions(catalog);
      setSelectedIds(new Set(assigned.map((p) => p.id)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const grouped = useMemo(() => {
    const byModule = {};
    for (const perm of allPermissions) {
      if (!byModule[perm.module]) byModule[perm.module] = [];
      byModule[perm.module].push(perm);
    }
    return Object.keys(byModule)
      .sort()
      .map((module) => ({ module, permissions: byModule[module] }));
  }, [allPermissions]);

  const toggle = (permId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const toggleModule = (modulePerms, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const p of modulePerms) {
        if (checked) next.add(p.id);
        else next.delete(p.id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await rolesApi.assignPermissions(id, Array.from(selectedIds));
      navigate('/roles');
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

  const isSuperAdmin = role?.name === 'SUPER_ADMIN';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={800} className="gradient-text" gutterBottom>
        {t('roles.assignPermissionsTitle', { role: role?.name || '' })}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {isSuperAdmin && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('roles.superAdminHasAllPermissions')}
        </Alert>
      )}

      <Paper sx={{ p: 3, borderTop: '4px solid', borderColor: 'primary.main' }}>
        <Grid container spacing={3}>
          {grouped.map(({ module, permissions }) => {
            const allChecked = permissions.every((p) => selectedIds.has(p.id));
            const someChecked = permissions.some((p) => selectedIds.has(p.id));
            return (
              <Grid item xs={12} md={6} key={module}>
                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                  <Checkbox
                    checked={allChecked}
                    indeterminate={!allChecked && someChecked}
                    disabled={isSuperAdmin}
                    onChange={(e) => toggleModule(permissions, e.target.checked)}
                  />
                  <Typography variant="subtitle1" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                    {module}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 1 }} />
                <FormGroup sx={{ pl: 2 }}>
                  {permissions.map((perm) => (
                    <FormControlLabel
                      key={perm.id}
                      control={
                        <Checkbox
                          checked={selectedIds.has(perm.id)}
                          disabled={isSuperAdmin}
                          onChange={() => toggle(perm.id)}
                        />
                      }
                      label={perm.description || `${perm.module}.${perm.action}`}
                    />
                  ))}
                </FormGroup>
              </Grid>
            );
          })}
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={submitting || isSuperAdmin}
          >
            {submitting ? <CircularProgress size={24} /> : t('common.save')}
          </Button>
          <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => navigate('/roles')}>
            {t('common.cancel')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default RolePermissionsPage;

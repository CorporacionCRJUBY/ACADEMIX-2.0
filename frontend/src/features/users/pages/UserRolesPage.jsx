// FILE: frontend/src/features/users/pages/UserRolesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import usersApi from '../api';
import rolesApi from '../../roles/api';

// Bug fix: the "Assign Roles" action in UserListPage linked to
// /users/:id/roles, but that route rendered the plain UserFormPage (which
// only edits the single legacy role_id field). It had no UI for the real
// many-to-many user_roles assignment, and the backend had no GET endpoint
// to load which roles were already assigned even if a UI had existed.
// This mirrors RolePermissionsPage's pattern for the users side.
const UserRolesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [allRoles, setAllRoles] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, catalogRes, assignedRes] = await Promise.all([
        usersApi.getById(id),
        rolesApi.getAll({ pageSize: 1000 }),
        usersApi.getRoles(id),
      ]);
      const userRecord = userRes?.data || userRes;
      const catalog = catalogRes?.data?.data || catalogRes?.data || [];
      const assigned = assignedRes?.data || assignedRes || [];

      setUser(userRecord);
      setAllRoles(catalog);
      setSelectedIds(new Set(assigned.map((r) => r.id)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (roleId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const handleSave = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await usersApi.assignRoles(id, Array.from(selectedIds));
      navigate('/users');
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={800} className="gradient-text" gutterBottom>
        {t('users.assignRolesTitle', { user: user?.full_name || '' })}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 2 }}>
        {t('users.assignRolesHint')}
      </Alert>

      <Paper sx={{ p: 3, borderTop: '4px solid', borderColor: 'primary.main' }}>
        <FormGroup>
          {allRoles.map((role) => (
            <FormControlLabel
              key={role.id}
              control={
                <Checkbox
                  checked={selectedIds.has(role.id)}
                  onChange={() => toggle(role.id)}
                />
              }
              label={role.description ? `${role.name} — ${role.description}` : role.name}
            />
          ))}
        </FormGroup>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : t('common.save')}
          </Button>
          <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => navigate('/users')}>
            {t('common.cancel')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default UserRolesPage;

// FILE: frontend/src/features/users/pages/UserListPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useConfirm from '../../../hooks/useConfirm';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VpnKey as PasswordIcon,
  Assignment as RolesIcon,
} from '@mui/icons-material';
import DataTable from '../../../components/DataTable';
import PermissionGate from '../../../components/PermissionGate';
import { usePermissions } from '../../../hooks/usePermissions';
import usersApi from '../api';

const UserListPage = () => {
  const { t } = useTranslation();
  const [confirm, ConfirmDialog] = useConfirm();
  const navigate = useNavigate();
  const { canCreate } = usePermissions();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const searchDebounceRef = useRef(null);

  const columns = [
    { field: 'code', label: t('users.code'), sortable: true },
    { field: 'full_name', label: t('users.fullName'), sortable: true },
    { field: 'email', label: t('users.email'), sortable: true },
    { field: 'phone', label: t('users.phone'), sortable: true },
    {
      field: 'role_id',
      label: t('users.role'),
      sortable: true,
      render: (value, row) => row.role_name || `Role ${value}`,
    },
    {
      field: 'branch_id',
      label: t('users.branch'),
      sortable: true,
      render: (value, row) => row.branch_name || (value ? `Branch ${value}` : '-'),
    },
    {
      field: 'status',
      label: t('users.status'),
      type: 'status',
      sortable: true,
    },
    {
      field: 'last_login',
      label: t('users.lastLogin'),
      type: 'datetime',
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleString() : '-',
    },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await usersApi.getAll({
        page: page + 1,
        pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      // `api.get` unwraps axios' response.data, so `response` here is the
      // `{ success, data, total, page, pageSize }` envelope from the backend.
      setData(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search, statusFilter]);

  const handleSearch = (value) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setPage(0);
      setSearch(value);
    }, 400);
  };

  useEffect(() => () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
  }, []);

  const handleFilterChange = (name, value) => {
    if (name === 'status') {
      setPage(0);
      setStatusFilter(value);
    }
  };

  const handleDelete = async (id) => {
    if (await confirm(t('common.confirmDelete'))) {
      try {
        await usersApi.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting:', error);
      }
    }
  };

  const rowActions = [
    {
      label: t('common.view'),
      icon: <ViewIcon fontSize="small" />,
      onClick: (row) => navigate(`/users/${row.id}`),
    },
    {
      label: t('common.edit'),
      icon: <EditIcon fontSize="small" />,
      onClick: (row) => navigate(`/users/${row.id}/edit`),
    },
    {
      label: t('users.changePassword'),
      icon: <PasswordIcon fontSize="small" color="warning" />,
      onClick: (row) => navigate(`/users/${row.id}/change-password`),
    },
    {
      label: t('users.assignRoles'),
      icon: <RolesIcon fontSize="small" color="primary" />,
      onClick: (row) => navigate(`/users/${row.id}/roles`),
    },
    {
      label: t('common.delete'),
      icon: <DeleteIcon fontSize="small" color="error" />,
      onClick: (row) => handleDelete(row.id),
    },
  ];

  return (
    <PermissionGate permission="users.view">
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h4" fontWeight={800} className="gradient-text">{t('users.title')}</Typography>
          <PermissionGate permission="users.create">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/users/new')}
            >
              {t('users.add')}
            </Button>
          </PermissionGate>
        </Box>

        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onRefresh={loadData}
          onRowClick={(row) => navigate(`/users/${row.id}`)}
          rowActions={rowActions}
          searchPlaceholder={t('users.search')}
          emptyMessage={t('users.noData')}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          filterValues={{ status: statusFilter }}
          filterFields={[
            {
              name: 'status',
              label: t('users.status'),
              options: [
                { value: 'ACTIVE', label: t('status.active') },
                { value: 'INACTIVE', label: t('status.inactive') },
                { value: 'SUSPENDED', label: t('status.suspended') },
              ],
            },
          ]}
        />
      {ConfirmDialog}
      </Box>
    </PermissionGate>
  );
};

export default UserListPage;
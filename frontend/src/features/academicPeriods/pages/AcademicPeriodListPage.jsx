// FILE: frontend/src/features/academicPeriods/pages/AcademicPeriodListPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useConfirm from '../../../hooks/useConfirm';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import DataTable from '../../../components/DataTable';
import PermissionGate from '../../../components/PermissionGate';
import { usePermissions } from '../../../hooks/usePermissions';
import academicPeriodsApi from '../api';

const AcademicPeriodListPage = () => {
  const { t } = useTranslation();
  const [confirm, ConfirmDialog] = useConfirm();
  const navigate = useNavigate();
  const { canCreate, canEdit } = usePermissions();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const searchDebounceRef = useRef(null);

  const columns = [
    { field: 'code', label: t('academicPeriods.code'), sortable: true },
    { field: 'name', label: t('academicPeriods.name'), sortable: true },
    {
      field: 'academic_year_id',
      label: t('academicPeriods.year'),
      sortable: true,
      render: (value, row) => row.year_name || `Year ${value}`,
    },
    {
      field: 'start_date',
      label: t('academicPeriods.startDate'),
      type: 'date',
      sortable: true,
    },
    {
      field: 'end_date',
      label: t('academicPeriods.endDate'),
      type: 'date',
      sortable: true,
    },
    {
      field: 'status',
      label: t('academicPeriods.status'),
      type: 'status',
      sortable: true,
    },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await academicPeriodsApi.getAll({
        page: page + 1,
        pageSize,
        search: search || undefined,
      });
      setData(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error loading periods:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search]);

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

  const handleDelete = async (id) => {
    if (await confirm(t('common.confirmDelete'))) {
      try {
        await academicPeriodsApi.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting:', error);
      }
    }
  };

  const handleClose = async (id) => {
    if (await confirm(t('academicPeriods.confirmClose'))) {
      try {
        await academicPeriodsApi.close(id);
        loadData();
      } catch (error) {
        console.error('Error closing:', error);
      }
    }
  };

  const handleLock = async (id) => {
    if (await confirm(t('academicPeriods.confirmLock'))) {
      try {
        await academicPeriodsApi.lock(id);
        loadData();
      } catch (error) {
        console.error('Error locking:', error);
      }
    }
  };

  const rowActions = [
    {
      label: t('common.view'),
      icon: <ViewIcon fontSize="small" />,
      onClick: (row) => navigate(`/academic-periods/${row.id}`),
    },
    {
      label: t('common.edit'),
      icon: <EditIcon fontSize="small" />,
      onClick: (row) => navigate(`/academic-periods/${row.id}/edit`),
    },
    {
      label: t('academicPeriods.close'),
      icon: <CloseIcon fontSize="small" />,
      onClick: (row) => handleClose(row.id),
      show: (row) => row.status === 'OPEN' && canEdit('academic-periods'),
    },
    {
      label: t('academicPeriods.lock'),
      icon: <LockIcon fontSize="small" />,
      onClick: (row) => handleLock(row.id),
      show: (row) => (row.status === 'OPEN' || row.status === 'CLOSED') && canEdit('academic-periods'),
    },
    {
      label: t('common.delete'),
      icon: <DeleteIcon fontSize="small" color="error" />,
      onClick: (row) => handleDelete(row.id),
      show: (row) => row.status !== 'LOCKED',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h4" fontWeight={800} className="gradient-text">{t('academicPeriods.title')}</Typography>
        <PermissionGate permission="academic-periods.create">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/academic-periods/new')}
          >
            {t('academicPeriods.add')}
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
        onRowClick={(row) => navigate(`/academic-periods/${row.id}`)}
        rowActions={rowActions}
        onSearch={handleSearch}
        searchPlaceholder={t('academicPeriods.search')}
        emptyMessage={t('academicPeriods.noData')}
      />
    {ConfirmDialog}
    </Box>
  );
};

export default AcademicPeriodListPage;
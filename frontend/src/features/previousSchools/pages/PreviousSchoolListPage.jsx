// FILE: frontend/src/features/previousSchools/pages/PreviousSchoolListPage.jsx
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
} from '@mui/icons-material';
import DataTable from '../../../components/DataTable';
import PermissionGate from '../../../components/PermissionGate';
import { usePermissions } from '../../../hooks/usePermissions';
import previousSchoolsApi from '../api';

const PreviousSchoolListPage = () => {
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
  const searchDebounceRef = useRef(null);

  const columns = [
    { field: 'code', label: t('previousSchools.code'), sortable: true },
    {
      field: 'student_id',
      label: t('previousSchools.student'),
      sortable: true,
      render: (value, row) => row.student_name || `Student ${value}`,
    },
    { field: 'school_name', label: t('previousSchools.school'), sortable: true },
    { field: 'grade_level', label: t('previousSchools.grade'), sortable: true },
    { field: 'year_attended', label: t('previousSchools.year'), sortable: true },
    {
      field: 'transcript_received',
      label: t('previousSchools.transcript'),
      sortable: true,
      render: (value) => value ? 
        <Chip label={t('common.yes')} color="success" size="small" /> : 
        <Chip label={t('common.no')} color="default" size="small" />,
    },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await previousSchoolsApi.getAll({
        page: page + 1,
        pageSize,
        search: search || undefined,
      });
      // `api.get` unwraps axios' response.data, so `response` here is the
      // `{ success, data, total, page, pageSize }` envelope from the backend.
      setData(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error loading previous schools:', error);
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
        await previousSchoolsApi.delete(id);
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
      onClick: (row) => navigate(`/previous-schools/${row.id}`),
    },
    {
      label: t('common.edit'),
      icon: <EditIcon fontSize="small" />,
      onClick: (row) => navigate(`/previous-schools/${row.id}/edit`),
    },
    {
      label: t('common.delete'),
      icon: <DeleteIcon fontSize="small" color="error" />,
      onClick: (row) => handleDelete(row.id),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h4" fontWeight={800} className="gradient-text">{t('previousSchools.title')}</Typography>
        <PermissionGate permission="previous-schools.create">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/previous-schools/new')}
          >
            {t('previousSchools.add')}
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
        onRowClick={(row) => navigate(`/previous-schools/${row.id}`)}
        rowActions={rowActions}
        searchPlaceholder={t('previousSchools.search')}
        emptyMessage={t('previousSchools.noData')}
        onSearch={handleSearch}
      />
    {ConfirmDialog}
    </Box>
  );
};

export default PreviousSchoolListPage;
// FILE: frontend/src/features/scholarships/pages/ScholarshipListPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useConfirm from '../../../hooks/useConfirm';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as StatusIcon,
} from '@mui/icons-material';
import DataTable from '../../../components/DataTable';
import PermissionGate from '../../../components/PermissionGate';
import scholarshipsApi from '../api';

const STATUS_TRANSITIONS = {
  REQUESTED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['SUSPENDED', 'EXPIRED', 'CANCELLED'],
  SUSPENDED: ['ACTIVE', 'EXPIRED'],
  REJECTED: ['REQUESTED'],
};

const ScholarshipListPage = () => {
  const { t } = useTranslation();
  const [confirm, ConfirmDialog] = useConfirm();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', scholarship_type: '' });
  const searchDebounceRef = useRef(null);

  // Status-change dialog (mirrors the pattern in Students — a Select inside
  // a Dialog, not a Menu anchored to the clicked row, since DataTable's row
  // actions only receive the row data, never the click event/DOM node).
  const [statusDialogRow, setStatusDialogRow] = useState(null);
  const [statusDialogValue, setStatusDialogValue] = useState('');
  const [statusDialogReason, setStatusDialogReason] = useState('');

  const columns = [
    { field: 'code', label: t('scholarships.code'), sortable: true },
    {
      field: 'student_id',
      label: t('scholarships.student'),
      sortable: true,
      render: (value, row) => row.student_name || `#${value}`,
    },
    {
      field: 'scholarship_type',
      label: t('scholarships.type'),
      sortable: true,
    },
    {
      field: 'percentage',
      label: t('scholarships.percentage'),
      sortable: true,
      render: (value) => (value ? `${value}%` : '-'),
    },
    {
      field: 'amount',
      label: t('scholarships.amount'),
      type: 'currency',
      sortable: true,
    },
    {
      field: 'status',
      label: t('scholarships.status'),
      type: 'status',
      sortable: true,
    },
    {
      field: 'start_date',
      label: t('scholarships.startDate'),
      type: 'date',
      sortable: true,
    },
    {
      field: 'end_date',
      label: t('scholarships.endDate'),
      type: 'date',
      sortable: true,
    },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await scholarshipsApi.getAll({
        page: page + 1,
        pageSize,
        search: search || undefined,
        status: filters.status || undefined,
        scholarshipType: filters.scholarship_type || undefined,
      });
      setData(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error loading scholarships:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search, filters]);

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
    setPage(0);
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDelete = async (id) => {
    if (await confirm(t('common.confirmDelete'))) {
      try {
        await scholarshipsApi.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting:', error);
      }
    }
  };

  const openStatusDialog = (row) => {
    setStatusDialogRow(row);
    setStatusDialogValue('');
    setStatusDialogReason('');
  };

  const confirmStatusChange = async () => {
    if (!statusDialogRow || !statusDialogValue) return;
    const row = statusDialogRow;
    const nextStatus = statusDialogValue;
    const reason = statusDialogReason;
    setStatusDialogRow(null);
    try {
      await scholarshipsApi.updateStatus(row.id, { status: nextStatus, reason: reason || undefined });
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const rowActions = [
    {
      label: t('common.view'),
      icon: <ViewIcon fontSize="small" />,
      onClick: (row) => navigate(`/scholarships/${row.id}`),
    },
    {
      label: t('common.edit'),
      icon: <EditIcon fontSize="small" />,
      onClick: (row) => navigate(`/scholarships/${row.id}/edit`),
    },
    {
      label: t('scholarships.updateStatus'),
      icon: <StatusIcon fontSize="small" />,
      onClick: openStatusDialog,
    },
    {
      label: t('common.delete'),
      icon: <DeleteIcon fontSize="small" color="error" />,
      onClick: (row) => handleDelete(row.id),
    },
  ];

  const availableStatuses = statusDialogRow ? (STATUS_TRANSITIONS[statusDialogRow.status] || []) : [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h4" fontWeight={800} className="gradient-text">{t('scholarships.title')}</Typography>
        <PermissionGate permission="scholarships.create">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/scholarships/new')}
          >
            {t('scholarships.add')}
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
        onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}
        onRefresh={loadData}
        onSearch={handleSearch}
        onRowClick={(row) => navigate(`/scholarships/${row.id}`)}
        rowActions={rowActions}
        searchPlaceholder={t('scholarships.search')}
        emptyMessage={t('scholarships.noData')}
        filterFields={[
          {
            name: 'status',
            label: t('scholarships.status'),
            options: [
              { value: 'REQUESTED', label: t('scholarships.requested') },
              { value: 'UNDER_REVIEW', label: t('scholarships.underReview') },
              { value: 'APPROVED', label: t('scholarships.approved') },
              { value: 'REJECTED', label: t('scholarships.rejected') },
              { value: 'ACTIVE', label: t('scholarships.active') },
              { value: 'SUSPENDED', label: t('scholarships.suspended') },
              { value: 'EXPIRED', label: t('scholarships.expired') },
              { value: 'CANCELLED', label: t('scholarships.cancelled') },
            ],
          },
          {
            name: 'scholarship_type',
            label: t('scholarships.type'),
            options: [
              { value: 'Académica', label: t('scholarships.academic') },
              { value: 'Deportiva', label: t('scholarships.sports') },
              { value: 'Cultural', label: t('scholarships.cultural') },
              { value: 'Necesidad', label: t('scholarships.need') },
            ],
          },
        ]}
        filterValues={filters}
        onFilterChange={handleFilterChange}
      />

      <Dialog open={!!statusDialogRow} onClose={() => setStatusDialogRow(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t('scholarships.updateStatus')}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>{t('scholarships.status')}</InputLabel>
            <Select
              label={t('scholarships.status')}
              value={statusDialogValue}
              onChange={(e) => setStatusDialogValue(e.target.value)}
            >
              {availableStatuses.map((s) => (
                <MenuItem key={s} value={s}>{t(`scholarships.${s.toLowerCase()}`)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {statusDialogValue === 'REJECTED' && (
            <TextField
              fullWidth
              multiline
              rows={2}
              sx={{ mt: 2 }}
              label={t('scholarships.rejectionReason', { defaultValue: 'Rejection Reason' })}
              value={statusDialogReason}
              onChange={(e) => setStatusDialogReason(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogRow(null)}>{t('common.cancel')}</Button>
          <Button onClick={confirmStatusChange} variant="contained" disabled={!statusDialogValue}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
      {ConfirmDialog}
    </Box>
  );
};

export default ScholarshipListPage;

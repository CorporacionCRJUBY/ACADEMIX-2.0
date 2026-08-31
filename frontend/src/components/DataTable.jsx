// FILE: frontend/src/components/DataTable.jsx
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TableSortLabel,
  TextField,
  InputAdornment,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Checkbox,
  LinearProgress,
  Typography,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const DataTable = ({
  columns,
  data,
  loading = false,
  total = 0,
  page = 0,
  pageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  onPageChange,
  onPageSizeChange,
  onSort,
  onSearch,
  onRefresh,
  onExport,
  onRowClick,
  onRowAction,
  actions = [],
  selectable = false,
  selected = [],
  onSelectChange,
  searchPlaceholder,
  showSearch = true,
  showFilter = true,
  showRefresh = true,
  showExport = true,
  filterFields = [],
  filterValues = {},
  onFilterChange,
  emptyMessage,
  dense = false,
  stickyHeader = false,
  height = 'auto',
  rowActions = [],
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  // Keyed by row id so opening the menu on one row never opens every other
  // row's menu at the same time (a single shared anchor caused that before).
  const [actionMenuRowId, setActionMenuRowId] = useState(null);
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Defensa: si por algún motivo `data` no llega como array (p.ej. la API
  // devuelve un objeto de paginación en vez del array de filas), evitamos
  // que toda la tabla explote con ".map is not a function".
  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  // Manejar cambios de página
  const handleChangePage = (event, newPage) => {
    if (onPageChange) onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newSize = parseInt(event.target.value, 10);
    if (onPageSizeChange) onPageSizeChange(newSize);
  };

  // Manejar ordenamiento
  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    const newDirection = isAsc ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    if (onSort) onSort(field, newDirection);
  };

  // Manejar búsqueda
  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (onSearch) onSearch(value);
  };

  // Manejar selección
  const handleSelectAll = (event) => {
    if (onSelectChange) {
      if (event.target.checked) {
        onSelectChange(rows.map((item) => item.id));
      } else {
        onSelectChange([]);
      }
    }
  };

  const handleSelectRow = (id) => {
    if (onSelectChange) {
      const newSelected = selected.includes(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id];
      onSelectChange(newSelected);
    }
  };

  // Renderizar celda según tipo de columna
  const renderCell = (column, row) => {
    const value = row[column.field];

    if (column.render) {
      return column.render(value, row);
    }

    if (column.type === 'status') {
      const statusMap = {
        ACTIVE: { label: t('status.active'), color: 'success' },
        INACTIVE: { label: t('status.inactive'), color: 'default' },
        PENDING: { label: t('status.pending'), color: 'warning' },
        APPROVED: { label: t('status.approved'), color: 'success' },
        REJECTED: { label: t('status.rejected'), color: 'error' },
        LOCKED: { label: t('status.locked'), color: 'error' },
        OPEN: { label: t('status.open'), color: 'success' },
        CLOSED: { label: t('status.closed'), color: 'default' },
        DRAFT: { label: t('status.draft'), color: 'warning' },
        OFFICIAL: { label: t('status.official'), color: 'success' },
        ARCHIVED: { label: t('status.archived'), color: 'default' },
      };
      const status = statusMap[value] || { label: value || '-', color: 'default' };
      return <Chip label={status.label} color={status.color} size="small" />;
    }

    if (column.type === 'date' && value) {
      return new Date(value).toLocaleDateString();
    }

    if (column.type === 'datetime' && value) {
      return new Date(value).toLocaleString();
    }

    if (column.type === 'currency' && value) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    }

    if (column.type === 'percentage' && value !== undefined && value !== null) {
      return `${value}%`;
    }

    if (value === null || value === undefined) {
      return '-';
    }

    return value;
  };

  // Renderizar acciones por fila
  const renderRowActions = (row) => {
    // `show: (row) => boolean` lets a module hide an action for specific rows
    // (e.g. no Delete on an already-OFFICIAL report). Actions without `show`
    // are always visible, matching the previous behavior.
    const visibleActions = rowActions.filter((action) => !action.show || action.show(row));
    // Keep an (empty) cell even with zero visible actions for this row, so
    // columns stay aligned with rows that do have actions.
    if (visibleActions.length === 0) return <TableCell align="right" onClick={(e) => e.stopPropagation()} />;

    const rowId = row.id;
    const menuOpen = actionMenuRowId === rowId && Boolean(actionMenuAnchorEl);

    return (
      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setActionMenuRowId(rowId);
            setActionMenuAnchorEl(e.currentTarget);
          }}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={menuOpen ? actionMenuAnchorEl : null}
          open={menuOpen}
          onClose={() => {
            setActionMenuRowId(null);
            setActionMenuAnchorEl(null);
          }}
        >
          {visibleActions.map((action, index) => (
            <MenuItem
              key={action.label || index}
              disabled={action.disabled ? action.disabled(row) : false}
              onClick={(e) => {
                e.stopPropagation();
                setActionMenuRowId(null);
                setActionMenuAnchorEl(null);
                if (action.onClick) action.onClick(row);
              }}
            >
              {action.icon && <Box mr={1} sx={{ display: 'flex', alignItems: 'center' }}>{action.icon}</Box>}
              {action.label}
            </MenuItem>
          ))}
        </Menu>
      </TableCell>
    );
  };

  return (
    <Paper elevation={0} variant="outlined" sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Barra de herramientas */}
      {(showSearch || showFilter || showRefresh || showExport) && (
        <Box
          sx={{
            p: 2,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            {showSearch && (
              <TextField
                size="small"
                placeholder={searchPlaceholder || t('common.search')}
                value={searchTerm}
                onChange={handleSearch}
                slotProps={{ input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                } }}
                sx={{
                  minWidth: 200,
                  maxWidth: 400,
                  '& .MuiOutlinedInput-root': { borderRadius: 999, bgcolor: 'background.default' },
                }}
              />
            )}

            {showFilter && filterFields.length > 0 && (
              <>
                <Tooltip title={t('common.filter')}>
                  <IconButton onClick={(e) => setFilterAnchorEl(e.currentTarget)}>
                    <FilterIcon />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={filterAnchorEl}
                  open={Boolean(filterAnchorEl)}
                  onClose={() => setFilterAnchorEl(null)}
                >
                  <Box sx={{ p: 2, minWidth: 200 }}>
                    {filterFields.map((field) => (
                      <FormControl key={field.name} fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>{field.label}</InputLabel>
                        <Select
                          value={filterValues[field.name] || ''}
                          onChange={(e) => {
                            if (onFilterChange) {
                              onFilterChange(field.name, e.target.value);
                            }
                          }}
                          label={field.label}
                        >
                          <MenuItem value="">{t('common.all')}</MenuItem>
                          {field.options.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ))}
                  </Box>
                </Menu>
              </>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {showRefresh && (
              <Tooltip title={t('common.refresh')}>
                <IconButton onClick={onRefresh} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}

            {showExport && (
              <Tooltip title={t('common.export')}>
                <IconButton onClick={onExport} disabled={loading}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            )}

            {actions.map((action, index) => (
              <Tooltip key={action.label || index} title={action.label}>
                <IconButton
                  onClick={action.onClick}
                  disabled={action.disabled || loading}
                  color={action.color || 'primary'}
                >
                  {action.icon}
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        </Box>
      )}

      {/* Tabla */}
      <TableContainer
        sx={{
          maxHeight: height !== 'auto' ? height : undefined,
          position: 'relative',
        }}
      >
        {loading && (
          <LinearProgress
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
            }}
          />
        )}

        <Table stickyHeader={stickyHeader} size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < rows.length}
                    checked={rows.length > 0 && selected.length === rows.length}
                    onChange={handleSelectAll}
                    disabled={loading}
                  />
                </TableCell>
              )}

              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  align={column.align || 'left'}
                  sx={{
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                    fontWeight: 'bold',
                  }}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={sortField === column.field}
                      direction={sortDirection === 'asc' ? 'asc' : 'desc'}
                      onClick={() => handleSort(column.field)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}

              {rowActions.length > 0 && (
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {t('common.actions')}
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading && rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length +
                    (selectable ? 1 : 0) +
                    (rowActions.length > 0 ? 1 : 0)
                  }
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography color="textSecondary">
                    {t('common.loading')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length +
                    (selectable ? 1 : 0) +
                    (rowActions.length > 0 ? 1 : 0)
                  }
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography color="textSecondary">
                    {emptyMessage || t('common.noData')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow
                  key={row.id || index}
                  hover={!!onRowClick}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.action.hover,
                    },
                  }}
                >
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.includes(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                        disabled={loading}
                      />
                    </TableCell>
                  )}

                  {columns.map((column) => (
                    <TableCell
                      key={column.field}
                      align={column.align || 'left'}
                      sx={{ maxWidth: column.maxWidth }}
                    >
                      {renderCell(column, row)}
                    </TableCell>
                  ))}

                  {rowActions.length > 0 && renderRowActions(row)}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación */}
      {(onPageChange || onPageSizeChange) && (
        <TablePagination
          rowsPerPageOptions={pageSizeOptions}
          component="div"
          count={total}
          rowsPerPage={pageSize}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={t('common.rowsPerPage')}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} ${t('common.of')} ${count}`
          }
        />
      )}
    </Paper>
  );
};

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.oneOf([
        'string',
        'number',
        'date',
        'datetime',
        'status',
        'currency',
        'percentage',
        'boolean',
        'custom',
      ]),
      align: PropTypes.oneOf(['left', 'center', 'right']),
      sortable: PropTypes.bool,
      minWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      maxWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      render: PropTypes.func,
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  total: PropTypes.number,
  page: PropTypes.number,
  pageSize: PropTypes.number,
  pageSizeOptions: PropTypes.array,
  onPageChange: PropTypes.func,
  onPageSizeChange: PropTypes.func,
  onSort: PropTypes.func,
  onSearch: PropTypes.func,
  onRefresh: PropTypes.func,
  onExport: PropTypes.func,
  onRowClick: PropTypes.func,
  onRowAction: PropTypes.func,
  actions: PropTypes.array,
  selectable: PropTypes.bool,
  selected: PropTypes.array,
  onSelectChange: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  showSearch: PropTypes.bool,
  showFilter: PropTypes.bool,
  showRefresh: PropTypes.bool,
  showExport: PropTypes.bool,
  filterFields: PropTypes.array,
  filterValues: PropTypes.object,
  onFilterChange: PropTypes.func,
  emptyMessage: PropTypes.string,
  dense: PropTypes.bool,
  stickyHeader: PropTypes.bool,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  rowActions: PropTypes.array,
};

export default DataTable;
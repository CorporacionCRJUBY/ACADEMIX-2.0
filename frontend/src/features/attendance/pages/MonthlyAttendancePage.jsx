// FILE: frontend/src/features/attendance/pages/MonthlyAttendancePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  PictureAsPdf as PdfIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { api } from '../../../api/axiosClient';

const STATUS_COLORS = {
  P: { bg: 'rgba(52,211,153,0.15)', text: '#34d399', label: 'Present' },
  O: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa', label: 'Online' },
  E: { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', label: 'Excused' },
  U: { bg: 'rgba(251,113,133,0.15)', text: '#fb7185', label: 'Unexcused' },
};

const MonthlyAttendancePage = () => {
  const { assignmentId: routeAssignmentId } = useParams();
  const navigate = useNavigate();

  const [assignmentId, setAssignmentId] = useState(routeAssignmentId || '');
  const [assignments, setAssignments] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [gridData, setGridData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar asignaciones para el selector
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const res = await api.get('/assignments?pageSize=100');
        const list = res.data?.data || res.data || [];
        setAssignments(list);
        if (!assignmentId && list.length > 0) {
          setAssignmentId(list[0].id);
        }
      } catch (err) {
        console.error('Error loading assignments:', err);
      }
    };
    loadAssignments();
  }, []);

  // Cargar matriz de asistencia
  const loadGrid = async () => {
    if (!assignmentId) return;
    setLoading(true);
    try {
      const res = await api.get(`/attendance/monthly/${assignmentId}/${year}/${month}`);
      setGridData(res.data?.data || res.data);
    } catch (err) {
      console.error('Error loading attendance matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assignmentId) {
      loadGrid();
    }
  }, [assignmentId, year, month]);

  const handleStatusClick = async (studentId, dayNumber, currentStatus) => {
    const nextStatus = currentStatus === 'P' ? 'O' : currentStatus === 'O' ? 'E' : currentStatus === 'E' ? 'U' : currentStatus === 'U' ? null : 'P';
    const paddedMonth = String(month).padStart(2, '0');
    const paddedDay = String(dayNumber).padStart(2, '0');
    const dateStr = `${year}-${paddedMonth}-${paddedDay}`;

    try {
      await api.post('/attendance/daily', {
        assignmentId,
        date: dateStr,
        records: [{ student_id: studentId, status: nextStatus || 'P' }]
      });
      loadGrid();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button variant="outlined" startIcon={<BackIcon />} onClick={() => navigate('/attendance')}>
            Back
          </Button>
          <Typography variant="h4" fontWeight={800} className="gradient-text">
            Monthly Class Attendance
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadGrid}>
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Selectors */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Academic Assignment</InputLabel>
              <Select
                value={assignmentId}
                label="Academic Assignment"
                onChange={(e) => setAssignmentId(e.target.value)}
              >
                {assignments.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.code} — {a.subject_name || `Subject #${a.subject_id}`} (Grade {a.grade} {a.section || ''})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Month</InputLabel>
              <Select value={month} label="Month" onChange={(e) => setMonth(e.target.value)}>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                  <MenuItem key={m} value={m}>
                    {new Date(2026, m - 1).toLocaleString('en-US', { month: 'long' })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Year</InputLabel>
              <Select value={year} label="Year" onChange={(e) => setYear(e.target.value)}>
                {[2025, 2026, 2027, 2028].map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Info Card */}
      {gridData?.assignment && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(124,58,237,0.08)', borderLeft: '4px solid #7c3aed' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">Teacher</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{gridData.assignment.teacher_name || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">Subject</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{gridData.assignment.subject_name || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">Grade & Section</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Grade {gridData.assignment.grade} {gridData.assignment.section || ''}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">Branch</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{gridData.assignment.branch_name || 'Kissimmee'}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Matrix Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : gridData?.students ? (
        <Paper sx={{ overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: '65vh' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 160, fontWeight: 'bold', bgcolor: '#4B1C71', color: '#FFF' }}>Student</TableCell>
                  <TableCell sx={{ width: 60, fontWeight: 'bold', bgcolor: '#4B1C71', color: '#FFF', textAlign: 'center' }}>Grade</TableCell>
                  {gridData.days?.map((d) => (
                    <TableCell
                      key={d.dayNumber}
                      sx={{
                        width: 32,
                        p: 0.5,
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                        bgcolor: d.isWeekend ? 'rgba(255,255,255,0.06)' : '#4b1c71',
                        color: d.isWeekend ? 'rgba(241,238,255,0.5)' : '#FFF',
                      }}
                    >
                      <div>{d.dayNumber}</div>
                      <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>{d.weekday}</div>
                    </TableCell>
                  ))}
                  <TableCell sx={{ width: 36, textAlign: 'center', fontWeight: 'bold', bgcolor: '#29B6F6', color: '#FFF' }}>O</TableCell>
                  <TableCell sx={{ width: 36, textAlign: 'center', fontWeight: 'bold', bgcolor: '#E53935', color: '#FFF' }}>U</TableCell>
                  <TableCell sx={{ width: 36, textAlign: 'center', fontWeight: 'bold', bgcolor: '#FFA726', color: '#FFF' }}>E</TableCell>
                  <TableCell sx={{ width: 36, textAlign: 'center', fontWeight: 'bold', bgcolor: '#4CAF50', color: '#FFF' }}>P</TableCell>
                  <TableCell sx={{ width: 60, textAlign: 'center', fontWeight: 'bold', bgcolor: '#4B1C71', color: '#FFF' }}>Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gridData.students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={38} sx={{ textAlign: 'center', py: 4 }}>
                      No active students found for this assignment's grade and section.
                    </TableCell>
                  </TableRow>
                ) : (
                  gridData.students.map((st) => (
                    <TableRow key={st.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{st.fullName}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>{st.grade}</TableCell>
                      {gridData.days?.map((d) => {
                        const val = st.records ? st.records[d.dayNumber] : null;
                        const colorInfo = val ? STATUS_COLORS[val] : null;
                        return (
                          <TableCell
                            key={d.dayNumber}
                            onClick={() => !d.isWeekend && handleStatusClick(st.id, d.dayNumber, val)}
                            sx={{
                              p: 0.25,
                              textAlign: 'center',
                              cursor: d.isWeekend ? 'default' : 'pointer',
                              bgcolor: d.isWeekend ? 'rgba(255,255,255,0.03)' : (colorInfo ? colorInfo.bg : 'inherit'),
                              color: colorInfo ? colorInfo.text : 'rgba(241,238,255,0.4)',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              '&:hover': {
                                bgcolor: d.isWeekend ? 'rgba(255,255,255,0.03)' : 'rgba(124,58,237,0.15)',
                              }
                            }}
                          >
                            {val || (d.isWeekend ? '·' : '-')}
                          </TableCell>
                        );
                      })}
                      <TableCell sx={{ textAlign: 'center', fontWeight: 600 }}>{st.totals?.online || 0}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 600, color: '#E53935' }}>{st.totals?.unexcused || 0}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 600, color: '#FFA726' }}>{st.totals?.excused || 0}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 600, color: '#4CAF50' }}>{st.totals?.present || 0}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#a78bfa' }}>
                        {st.totals?.attendanceRate || 100}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Legend */}
          <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', bgcolor: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(167,139,250,0.14)' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Status Legend (Click cell to change):</Typography>
            <Chip size="small" label="P = Present" sx={{ bgcolor: 'rgba(52,211,153,0.15)', color: '#34d399', fontWeight: 'bold' }} />
            <Chip size="small" label="O = Online" sx={{ bgcolor: 'rgba(96,165,250,0.15)', color: '#60a5fa', fontWeight: 'bold' }} />
            <Chip size="small" label="E = Excused" sx={{ bgcolor: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontWeight: 'bold' }} />
            <Chip size="small" label="U = Unexcused" sx={{ bgcolor: 'rgba(251,113,133,0.15)', color: '#fb7185', fontWeight: 'bold' }} />
          </Box>
        </Paper>
      ) : null}
    </Box>
  );
};

export default MonthlyAttendancePage;

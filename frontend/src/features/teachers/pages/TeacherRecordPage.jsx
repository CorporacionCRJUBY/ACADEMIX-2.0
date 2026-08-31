// FILE: frontend/src/features/teachers/pages/TeacherRecordPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Work as AssignmentsIcon,
} from '@mui/icons-material';
import teachersApi from '../api';
import branchesApi from '../../branches/api';
import { formatDate } from '../../../utils/formatters';

const STATUS_COLOR = {
  ACTIVE: 'success',
  INACTIVE: 'default',
};

const TeacherRecordPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Coming from the "assignments" row action lands directly on that tab.
  const initialTab = location.pathname.endsWith('/assignments') ? 1 : 0;
  const [tabIndex, setTabIndex] = useState(initialTab);

  const [teacher, setTeacher] = useState(null);
  const [branches, setBranches] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [error, setError] = useState(null);

  const loadTeacher = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [teacherRes, branchesRes] = await Promise.allSettled([
        teachersApi.getById(id),
        branchesApi.getAll(),
      ]);
      if (teacherRes.status === 'fulfilled') {
        setTeacher(teacherRes.value?.data || teacherRes.value);
      } else {
        throw teacherRes.reason;
      }
      if (branchesRes.status === 'fulfilled') {
        setBranches(branchesRes.value?.data?.data || branchesRes.value?.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadAssignments = useCallback(async () => {
    setLoadingAssignments(true);
    try {
      const response = await teachersApi.getAssignments(id);
      const list = response?.data?.data || response?.data || response || [];
      setAssignments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error loading assignments:', err);
    } finally {
      setLoadingAssignments(false);
    }
  }, [id]);

  useEffect(() => {
    loadTeacher();
  }, [loadTeacher]);

  useEffect(() => {
    if (tabIndex === 1) {
      loadAssignments();
    }
  }, [tabIndex, loadAssignments]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !teacher) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || t('teachers.noData')}</Alert>
        <Button sx={{ mt: 2 }} startIcon={<BackIcon />} onClick={() => navigate('/teachers')}>
          {t('teachers.backToList')}
        </Button>
      </Box>
    );
  }

  const initials = `${teacher.first_name?.[0] || ''}${teacher.last_name?.[0] || ''}`.toUpperCase();
  const branchName = branches.find((b) => b.id === teacher.branch_id)?.name || teacher.branch_name;

  return (
    <Box sx={{ p: 3 }}>
      <Button startIcon={<BackIcon />} onClick={() => navigate('/teachers')} sx={{ mb: 2 }}>
        {t('teachers.backToList')}
      </Button>

      <Paper sx={{ p: 3, mb: 3, borderTop: '4px solid', borderColor: 'primary.main' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: '#d1b3ff', color: '#241035', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {initials || '?'}
            </Avatar>
            <Box>
              <Typography variant="body2" color="textSecondary">{teacher.code}</Typography>
              <Typography variant="h5" fontWeight={800}>{teacher.first_name} {teacher.last_name}</Typography>
              <Typography variant="body2" color="textSecondary">{teacher.specialization || '-'}</Typography>
              <Chip
                size="small"
                label={teacher.status === 'ACTIVE' ? t('status.active') : t('status.inactive')}
                color={STATUS_COLOR[teacher.status] || 'default'}
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>
          <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/teachers/${id}/edit`)}>
            {t('common.edit')}
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<PersonIcon fontSize="small" />} iconPosition="start" label={t('teachers.overview')} />
          <Tab icon={<AssignmentsIcon fontSize="small" />} iconPosition="start" label={t('teachers.assignments')} />
        </Tabs>
      </Paper>

      {tabIndex === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ color: '#d1b3ff', fontWeight: 700, mb: 2 }}>{t('teachers.personalInfo')}</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="textSecondary">{t('teachers.email')}</Typography>
              <Typography variant="body1">{teacher.email || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="textSecondary">{t('teachers.phone')}</Typography>
              <Typography variant="body1">{teacher.phone || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="textSecondary">{t('teachers.branch')}</Typography>
              <Typography variant="body1">{branchName || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="textSecondary">{t('teachers.hireDate')}</Typography>
              <Typography variant="body1">{formatDate(teacher.hire_date)}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="textSecondary">{t('teachers.notes')}</Typography>
              <Typography variant="body1">{teacher.notes || '-'}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {tabIndex === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ color: '#d1b3ff', fontWeight: 700, mb: 2 }}>{t('teachers.assignments')}</Typography>
          <Divider sx={{ mb: 2 }} />
          {loadingAssignments ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : assignments.length === 0 ? (
            <Typography variant="body2" color="textSecondary">{t('teachers.noAssignments')}</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('teachers.subject')}</TableCell>
                    <TableCell>{t('teachers.grade')}</TableCell>
                    <TableCell>{t('teachers.section')}</TableCell>
                    <TableCell>{t('teachers.academicYear')}</TableCell>
                    <TableCell>{t('teachers.schedule')}</TableCell>
                    <TableCell>{t('teachers.status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.subject_name}</TableCell>
                      <TableCell>{a.grade}</TableCell>
                      <TableCell>{a.section || '-'}</TableCell>
                      <TableCell>{a.academic_year_name}</TableCell>
                      <TableCell>{a.schedule || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={a.status === 'ACTIVE' ? t('status.active') : t('status.inactive')}
                          color={STATUS_COLOR[a.status] || 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default TeacherRecordPage;

// FILE: frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  People as StudentsIcon,
  School as TeachersIcon,
  Grade as GradesIcon,
  CalendarToday as AttendanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  Description as ReportIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { api } from '../api/axiosClient';

const DashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { canView } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    grades: 0,
    attendance: 0,
    assignments: 0,
    reports: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [attendanceToday, setAttendanceToday] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);

    // FIX (auditoria hallazgo medio M5): con Promise.all, si el usuario no
    // tiene permiso en UN módulo (403) rechazaban TODAS y el dashboard
    // quedaba en ceros. Con Promise.allSettled cada módulo se resuelve de
    // forma independiente y los rechazados toman su valor por defecto.
    try {
      const [studentsRes, teachersRes, gradesRes, attendanceRes, assignmentsRes, reportsRes] = await Promise.allSettled([
        api.get('/students', { params: { pageSize: 1 } }),
        api.get('/teachers', { params: { pageSize: 1 } }),
        api.get('/grades', { params: { pageSize: 1 } }),
        api.get('/attendance', { params: { pageSize: 1 } }),
        api.get('/assignments', { params: { pageSize: 1 } }),
        api.get('/reports', { params: { pageSize: 1 } }),
      ]);

      const totalOrZero = (result) => (result.status === 'fulfilled' ? result.value?.total || 0 : 0);

      setStats({
        students: totalOrZero(studentsRes),
        teachers: totalOrZero(teachersRes),
        grades: totalOrZero(gradesRes),
        attendance: totalOrZero(attendanceRes),
        assignments: totalOrZero(assignmentsRes),
        reports: totalOrZero(reportsRes),
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }

    // FIX (auditoria hallazgo medio M5): las cargas secuenciales van en
    // try/catch independientes para que el fallo de una no impida la otra.

    // Cargar actividad reciente
    // La respuesta tiene forma { success, data: { data: [...], page, pageSize } }
    try {
      const activityRes = await api.get('/activity', { params: { pageSize: 5 } });
      const activityList = activityRes?.data?.data;
      setRecentActivity(Array.isArray(activityList) ? activityList : []);
    } catch (error) {
      console.error('Error loading recent activity:', error);
      setRecentActivity([]);
    }

    // Cargar asistencia del día
    try {
      const today = new Date().toISOString().split('T')[0];
      const attendanceRes2 = await api.get('/attendance', { params: { date: today, pageSize: 10 } });
      const attendanceList = attendanceRes2?.data?.data;
      setAttendanceToday(Array.isArray(attendanceList) ? attendanceList : []);
    } catch (error) {
      console.error('Error loading today attendance:', error);
      setAttendanceToday([]);
    }

    setLoading(false);
  };

  const getAttendanceStatusColor = (status) => {
    const colors = {
      P: 'success',
      O: 'info',
      E: 'warning',
      U: 'error',
    };
    return colors[status] || 'default';
  };

  const getActivityIcon = (module) => {
    const icons = {
      students: <StudentsIcon fontSize="small" />,
      teachers: <TeachersIcon fontSize="small" />,
      grades: <GradesIcon fontSize="small" />,
      attendance: <AttendanceIcon fontSize="small" />,
      assignments: <AssignmentIcon fontSize="small" />,
      reports: <ReportIcon fontSize="small" />,
    };
    return icons[module] || <AssignmentIcon fontSize="small" />;
  };

  const statCards = [
    {
      title: t('students.title'),
      value: stats.students,
      icon: <StudentsIcon sx={{ fontSize: 40 }} />,
      color: 'linear-gradient(135deg, #7C3AED 0%, #6423C4 100%)',
      permission: 'students.view',
    },
    {
      title: t('teachers.title'),
      value: stats.teachers,
      icon: <TeachersIcon sx={{ fontSize: 40 }} />,
      color: 'linear-gradient(135deg, #A470D1 0%, #6423C4 100%)',
      permission: 'teachers.view',
    },
    {
      title: t('grades.title'),
      value: stats.grades,
      icon: <GradesIcon sx={{ fontSize: 40 }} />,
      color: 'linear-gradient(135deg, #D6409F 0%, #7C3AED 100%)',
      permission: 'grades.view',
    },
    {
      title: t('attendance.title'),
      value: stats.attendance,
      icon: <AttendanceIcon sx={{ fontSize: 40 }} />,
      color: 'linear-gradient(135deg, #6423C4 0%, #241035 100%)',
      permission: 'attendance.view',
    },
    {
      title: t('assignments.title'),
      value: stats.assignments,
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      color: 'linear-gradient(135deg, #9F67FF 0%, #A22D77 100%)',
      permission: 'assignments.view',
    },
    {
      title: t('reports.title'),
      value: stats.reports,
      icon: <ReportIcon sx={{ fontSize: 40 }} />,
      color: 'linear-gradient(135deg, #C3A0E3 0%, #6423C4 100%)',
      permission: 'reports.view',
    },
  ];

  const filteredStats = statCards.filter(stat => 
    !stat.permission || canView(stat.permission.split('.')[0])
  );

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          p: 3,
          borderRadius: 4,
          backgroundImage: (theme) => theme.academix?.gradientPrimary,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 95% 0%, rgba(255,255,255,0.14) 0%, transparent 45%)',
          }}
        />
        <Box sx={{ position: 'relative' }}>
          <Typography variant="h4" fontWeight={800}>
            {t('dashboard.welcome')}, {user?.full_name || t('common.defaultUserName')}!
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
            {t('dashboard.subtitle')}
          </Typography>
        </Box>
        <IconButton onClick={loadDashboardData} disabled={loading} sx={{ color: '#fff', position: 'relative' }}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {loading ? (
        <LinearProgress />
      ) : (
        <>
          {/* Estadísticas */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {filteredStats.map((stat) => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={stat.title}>
                <Card
                  sx={{
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': { transform: 'translateY(-3px)', boxShadow: (theme) => theme.academix?.shadowLg },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      top: 0,
                      height: 4,
                      backgroundImage: stat.color,
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" component="div" fontWeight={800}>
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" fontWeight={500}>
                          {stat.title}
                        </Typography>
                      </Box>
                      <Avatar
                        sx={{
                          backgroundImage: stat.color,
                          width: 56,
                          height: 56,
                          boxShadow: '0 6px 16px rgba(76, 29, 149, 0.25)',
                        }}
                      >
                        {stat.icon}
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3}>
            {/* Actividad Reciente */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {t('dashboard.recentActivity')}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {recentActivity.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                    {t('common.noData')}
                  </Typography>
                ) : (
                  <List dense>
                    {recentActivity.map((activity, index) => (
                      <ListItem key={activity.id || index}>
                        <ListItemIcon>
                          {getActivityIcon(activity.module)}
                        </ListItemIcon>
                        <ListItemText
                          primary={activity.action}
                          secondary={
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" color="textSecondary">
                                {activity.module}
                              </Typography>
                              <Chip
                                label={activity.action}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                              <Typography variant="caption" color="textSecondary">
                                {new Date(activity.created_at).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>

            {/* Asistencia del Día */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {t('dashboard.todayAttendance')}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {attendanceToday.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                    {t('common.noData')}
                  </Typography>
                ) : (
                  <List dense>
                    {attendanceToday.map((record, index) => (
                      <ListItem key={record.id || `${record.student_id}-${record.date}`}>
                        <ListItemIcon>
                          <Chip
                            label={record.status}
                            size="small"
                            color={getAttendanceStatusColor(record.status)}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={record.student_name || `Student ${record.student_id}`}
                          secondary={record.date}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default DashboardPage;
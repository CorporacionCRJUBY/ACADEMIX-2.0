// FILE: frontend/src/layouts/MainLayout.jsx
import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as StudentsIcon,
  School as TeachersIcon,
  Book as SubjectsIcon,
  Grade as GradesIcon,
  CalendarToday as AttendanceIcon,
  Assignment as AssignmentsIcon,
  History as AcademicHistoryIcon,
  EventNote as CalendarIcon,
  Receipt as CreditsIcon,
  Description as ReportsIcon,
  Security as AuditIcon,
  Settings as SettingsIcon,
  AccountCircle as ProfileIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  Notifications as NotificationsIcon,
  Translate as TranslateIcon,
  Business as BranchesIcon,
  PeopleAlt as UsersIcon,
  Gavel as RolesIcon,
  Lock as PermissionsIcon,
  CardMembership as GraduationIcon,
  Star as ScholarshipsIcon,
  ExpandLess,
  ExpandMore,
  Folder as DocumentsIcon,
  MedicalServices as MedicalIcon,
  ContactPhone as GuardiansIcon,
  CheckCircleOutlineOutlined as GransifIcon,
  Rule as RequestsIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
// FIX (auditoria hallazgo medio M4): snackbar global que muestra los errores
// de API que los ListPages solo registraban en console.error.
import GlobalErrorSnackbar from '../components/GlobalErrorSnackbar';

const drawerWidth = 260;

const MainLayout = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { currentLanguage, changeLanguage, supportedLanguages } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);

  // Estados de acordeones
  const [openSections, setOpenSections] = useState({
    students: true,
    teachers: false,
    attendance: true,
    grades: false,
    reports: false,
    graduation: false,
    admin: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const isAdmin = user?.roles?.includes('SUPER_ADMIN') || user?.roles?.includes('ADMIN');

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageMenu = (event) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageAnchorEl(null);
  };

  const handleLanguageChange = async (lang) => {
    await changeLanguage(lang);
    handleLanguageClose();
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const isSelected = (path) => location.pathname === path;

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        className="no-print"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.16)',
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1.5,
            }}
          >
            <DashboardIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 800, letterSpacing: 0.5 }}>
            ACADEMIX 2.0
          </Typography>

          <Tooltip title={t('common.language')}>
            <IconButton color="inherit" onClick={handleLanguageMenu}>
              <TranslateIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={languageAnchorEl}
            open={Boolean(languageAnchorEl)}
            onClose={handleLanguageClose}
          >
            {supportedLanguages.map((lang) => (
              <MenuItem
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                selected={currentLanguage === lang.code}
              >
                {lang.label}
              </MenuItem>
            ))}
          </Menu>

          <IconButton color="inherit">
            <Badge badgeContent={0} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton color="inherit" onClick={handleMenu}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main, color: theme.palette.primary.main, fontWeight: 'bold' }}>
              {user?.full_name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
              <ListItemIcon><ProfileIcon fontSize="small" /></ListItemIcon>
              <ListItemText>{t('profile.title') || 'My Profile'}</ListItemText>
            </MenuItem>
            {isAdmin && (
              <MenuItem onClick={() => { handleMenuClose(); navigate('/admin'); }}>
                <ListItemIcon><AdminIcon fontSize="small" /></ListItemIcon>
                <ListItemText>{t('admin.console') || 'Super Admin Console'}</ListItemText>
              </MenuItem>
            )}
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              <ListItemText>{t('auth.logout') || 'Logout'}</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        className="no-print"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            marginTop: '64px',
            pb: 4,
          },
        }}
      >
        <Box sx={{ overflow: 'auto' }}>
          <Box
            sx={{
              mx: 1.5,
              mt: 1.5,
              mb: 1,
              p: 2,
              borderRadius: 3,
              backgroundImage: theme.academix?.gradientPrimary,
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
                  'radial-gradient(circle at 90% 10%, rgba(255,255,255,0.16) 0%, transparent 55%)',
              }}
            />
            <Typography variant="caption" sx={{ opacity: 0.85, position: 'relative' }}>
              {t('dashboard.welcome') || 'Bienvenido/a'}
            </Typography>
            <Typography variant="subtitle1" fontWeight={700} sx={{ position: 'relative', lineHeight: 1.2 }} noWrap>
              {user?.full_name || t('common.defaultUserName')}
            </Typography>
          </Box>

          <List component="nav" dense>
            {/* Dashboard */}
            <ListItemButton selected={isSelected('/dashboard')} onClick={() => handleNavigate('/dashboard')}>
              <ListItemIcon><DashboardIcon color="primary" /></ListItemIcon>
              <ListItemText primary={t('dashboard.title') || 'Dashboard'} primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>

            <Divider sx={{ my: 1 }} />

            {/* Students Group */}
            <ListItemButton onClick={() => toggleSection('students')}>
              <ListItemIcon><StudentsIcon color="primary" /></ListItemIcon>
              <ListItemText primary={t('students.title') || 'Students'} primaryTypographyProps={{ fontWeight: 600 }} />
              {openSections.students ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={openSections.students} timeout="auto" unmountOnExit>
              <List component="div" disablePadding dense>
                <ListItemButton sx={{ pl: 4 }} selected={isSelected('/students')} onClick={() => handleNavigate('/students')}>
                  <ListItemText primary={t('admin.menu.studentsList')} />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4 }} selected={isSelected('/guardians')} onClick={() => handleNavigate('/guardians')}>
                  <ListItemText primary={t('admin.menu.guardians')} />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4 }} selected={isSelected('/documents')} onClick={() => handleNavigate('/documents')}>
                  <ListItemText primary={t('admin.menu.documents')} />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4 }} selected={isSelected('/medical-records')} onClick={() => handleNavigate('/medical-records')}>
                  <ListItemText primary={t('admin.menu.medicalRecords')} />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4 }} selected={isSelected('/academic-history')} onClick={() => handleNavigate('/academic-history')}>
                  <ListItemText primary={t('admin.menu.academicHistory')} />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4 }} selected={isSelected('/previous-schools')} onClick={() => handleNavigate('/previous-schools')}>
                  <ListItemText primary={t('admin.menu.previousSchools')} />
                </ListItemButton>
              </List>
            </Collapse>

            {/* Teachers Group */}
            <ListItemButton onClick={() => toggleSection('teachers')}>
              <ListItemIcon><TeachersIcon color="primary" /></ListItemIcon>
              <ListItemText primary={t('teachers.title') || 'Teachers'} primaryTypographyProps={{ fontWeight: 600 }} />
              {openSections.teachers ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={openSections.teachers} timeout="auto" unmountOnExit>
              <List component="div" disablePadding dense>
                <ListItemButton sx={{ pl: 4 }} selected={isSelected('/teachers')} onClick={() => handleNavigate('/teachers')}>
                  <ListItemText primary={t('admin.menu.teachersList')} />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4 }} selected={isSelected('/assignments')} onClick={() => handleNavigate('/assignments')}>
                  <ListItemText primary={t('admin.menu.myAssignments')} />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4 }} selected={isSelected('/subjects')} onClick={() => handleNavigate('/subjects')}>
                  <ListItemText primary={t('admin.menu.subjects')} />
                </ListItemButton>
              </List>
            </Collapse>

            {/* Attendance Group */}
            <ListItemButton onClick={() => toggleSection('attendance')}>
              <ListItemIcon><AttendanceIcon color="primary" /></ListItemIcon>
              <ListItemText primary={t('attendance.title') || 'Attendance'} primaryTypographyProps={{ fontWeight: 600 }} />
              {openSections.attendance ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={openSections.attendance} timeout="auto" unmountOnExit>
              <List component="div" disablePadding dense>
                <ListItemButton sx={{ pl: 4 }} selected={isSelected('/attendance')} onClick={() => handleNavigate('/attendance')}>
                  <ListItemText primary={t('admin.menu.dailyAttendance')} />
                </ListItemButton>
                {/* FIX (auditoria hallazgo bajo B8): ahora navega a la vista
                    mensual real (/attendance/monthly, ruta agregada en App.jsx);
                    antes llevaba a /attendance, la lista diaria. */}
                <ListItemButton sx={{ pl: 4 }} selected={location.pathname.startsWith('/attendance/monthly')} onClick={() => handleNavigate('/attendance/monthly')}>
                  <ListItemText primary={t('admin.menu.monthlyGrid')} />
                </ListItemButton>
              </List>
            </Collapse>

            {/* Grades Group */}
            <ListItemButton onClick={() => toggleSection('grades')}>
              <ListItemIcon><GradesIcon color="primary" /></ListItemIcon>
              <ListItemText primary={t('grades.title') || 'Grades'} primaryTypographyProps={{ fontWeight: 600 }} />
              {openSections.grades ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={openSections.grades} timeout="auto" unmountOnExit>
              <List component="div" disablePadding dense>
                <ListItemButton sx={{ pl: 4 }} selected={isSelected('/grades')} onClick={() => handleNavigate('/grades')}>
                  <ListItemText primary={t('admin.menu.gradebook')} />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4 }} selected={isSelected('/academic-periods')} onClick={() => handleNavigate('/academic-periods')}>
                  <ListItemText primary={t('admin.menu.academicPeriods')} />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4 }} selected={isSelected('/grade-change-requests')} onClick={() => handleNavigate('/grade-change-requests')}>
                  <ListItemText primary={t('admin.menu.gradeChangeRequests')} />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4 }} selected={isSelected('/credits')} onClick={() => handleNavigate('/credits')}>
                  <ListItemText primary={t('admin.menu.creditsManagement')} />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4 }} selected={isSelected('/gpa')} onClick={() => handleNavigate('/gpa')}>
                  <ListItemText primary={t('admin.menu.gpaCalculation')} />
                </ListItemButton>
              </List>
            </Collapse>

            {/* Scholarships */}
            <ListItemButton selected={isSelected('/scholarships')} onClick={() => handleNavigate('/scholarships')}>
              <ListItemIcon><ScholarshipsIcon color="primary" /></ListItemIcon>
              <ListItemText primary={t('scholarships.title') || 'Scholarships'} primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>

            {/* Reports Center */}
            <ListItemButton onClick={() => toggleSection('reports')}>
              <ListItemIcon><ReportsIcon color="primary" /></ListItemIcon>
              <ListItemText primary={t('admin.menu.reportCenter')} primaryTypographyProps={{ fontWeight: 600 }} />
              {openSections.reports ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={openSections.reports} timeout="auto" unmountOnExit>
              <List component="div" disablePadding dense>
                <ListItemButton sx={{ pl: 4 }} selected={isSelected('/reports')} onClick={() => handleNavigate('/reports')}>
                  <ListItemText primary={t('admin.menu.allReports')} />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4 }} selected={isSelected('/progress-reports')} onClick={() => handleNavigate('/progress-reports')}>
                  <ListItemText primary={t('admin.menu.progressReports')} />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4 }} selected={isSelected('/report-cards')} onClick={() => handleNavigate('/report-cards')}>
                  <ListItemText primary={t('admin.menu.reportCards')} />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4 }} selected={isSelected('/transcripts')} onClick={() => handleNavigate('/transcripts')}>
                  <ListItemText primary={t('admin.menu.officialTranscripts')} />
                </ListItemButton>
              </List>
            </Collapse>

            {/* Graduation */}
            <ListItemButton onClick={() => toggleSection('graduation')}>
              <ListItemIcon><GraduationIcon color="primary" /></ListItemIcon>
              <ListItemText primary={t('graduation.title') || 'Graduation'} primaryTypographyProps={{ fontWeight: 600 }} />
              {openSections.graduation ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={openSections.graduation} timeout="auto" unmountOnExit>
              <List component="div" disablePadding dense>
                <ListItemButton sx={{ pl: 4 }} selected={isSelected('/graduation')} onClick={() => handleNavigate('/graduation')}>
                  <ListItemText primary={t('admin.menu.graduationCenter')} />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4 }} selected={isSelected('/gransif')} onClick={() => handleNavigate('/gransif')}>
                  <ListItemText primary={t('admin.menu.gransif')} />
                </ListItemButton>
              </List>
            </Collapse>

            {/* Branches & Calendar */}
            <ListItemButton selected={isSelected('/branches')} onClick={() => handleNavigate('/branches')}>
              <ListItemIcon><BranchesIcon color="primary" /></ListItemIcon>
              <ListItemText primary={t('branches.title') || 'Branches'} primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>

            <ListItemButton selected={isSelected('/calendar')} onClick={() => handleNavigate('/calendar')}>
              <ListItemIcon><CalendarIcon color="primary" /></ListItemIcon>
              <ListItemText primary={t('calendar.title') || 'School Calendar'} primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>

            {/* Admin Section */}
            {isAdmin && (
              <>
                <Divider sx={{ my: 1 }} />
                <ListItemButton onClick={() => toggleSection('admin')}>
                  <ListItemIcon><AdminIcon color="primary" /></ListItemIcon>
                  <ListItemText primary={t('admin.menu.administration')} primaryTypographyProps={{ fontWeight: 600 }} />
                  {openSections.admin ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={openSections.admin} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding dense>
                    <ListItemButton sx={{ pl: 4 }} selected={isSelected('/users')} onClick={() => handleNavigate('/users')}>
                      <ListItemText primary={t('admin.menu.users')} />
                    </ListItemButton>
                    <ListItemButton sx={{ pl: 4 }} selected={isSelected('/roles')} onClick={() => handleNavigate('/roles')}>
                      <ListItemText primary={t('admin.menu.roles')} />
                    </ListItemButton>
                    <ListItemButton sx={{ pl: 4 }} selected={isSelected('/permissions')} onClick={() => handleNavigate('/permissions')}>
                      <ListItemText primary={t('admin.menu.permissions')} />
                    </ListItemButton>
                    <ListItemButton sx={{ pl: 4 }} selected={isSelected('/academic-years')} onClick={() => handleNavigate('/academic-years')}>
                      <ListItemText primary={t('admin.menu.academicYears')} />
                    </ListItemButton>
                    <ListItemButton sx={{ pl: 4 }} selected={isSelected('/audit')} onClick={() => handleNavigate('/audit')}>
                      <ListItemText primary={t('admin.menu.auditLogs')} />
                    </ListItemButton>
                    <ListItemButton sx={{ pl: 4 }} selected={isSelected('/activity')} onClick={() => handleNavigate('/activity')}>
                      <ListItemText primary={t('admin.menu.activityFeed')} />
                    </ListItemButton>
                    <ListItemButton sx={{ pl: 4 }} selected={isSelected('/settings')} onClick={() => handleNavigate('/settings')}>
                      <ListItemText primary={t('admin.menu.systemSettings')} />
                    </ListItemButton>
                  </List>
                </Collapse>
              </>
            )}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginTop: '64px',
          marginLeft: drawerOpen ? '0px' : `-${drawerWidth}px`,
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Outlet />
      </Box>

      {/* FIX (auditoria hallazgo medio M4): una sola instancia por layout */}
      <GlobalErrorSnackbar />
    </Box>
  );
};

export default MainLayout;

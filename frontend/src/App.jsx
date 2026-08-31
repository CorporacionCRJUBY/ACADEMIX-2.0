// FILE: frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth
import LoginPage from './pages/Login';

// Dashboard
import DashboardPage from './pages/Dashboard';

// Features
import { AcademicHistoryListPage, AcademicHistoryFormPage } from './features/academicHistory';
import { AcademicPeriodListPage, AcademicPeriodFormPage } from './features/academicPeriods';
import { AcademicYearListPage, AcademicYearFormPage } from './features/academicYears';
import { ActivityListPage, ActivityFormPage } from './features/activity';
import { AssignmentListPage, AssignmentFormPage } from './features/assignments';
import { AttendanceListPage, AttendanceFormPage, MonthlyAttendancePage } from './features/attendance';
import { AuditListPage, AuditFormPage } from './features/audit';
import { BranchListPage, BranchFormPage } from './features/branches';
import { CalendarListPage, CalendarFormPage } from './features/calendar';
import { CreditListPage, CreditFormPage } from './features/credits';
import { DocumentListPage, DocumentFormPage } from './features/documents';
import { GpaListPage, GpaFormPage } from './features/gpa';
import { GradeChangeRequestListPage, GradeChangeRequestFormPage } from './features/gradeChangeRequests';
import { GradeListPage, GradeFormPage } from './features/grades';
import { GraduationListPage, GraduationFormPage } from './features/graduation';
import { GransifListPage, GransifFormPage } from './features/gransif';
import { GuardianListPage, GuardianFormPage } from './features/guardians';
import { MedicalRecordListPage, MedicalRecordFormPage } from './features/medicalRecords';
import { PermissionListPage, PermissionFormPage } from './features/permissions';
import { PreviousSchoolListPage, PreviousSchoolFormPage } from './features/previousSchools';
import { ProgressReportListPage, ProgressReportFormPage } from './features/progressReports';
import { ReportCardListPage, ReportCardFormPage } from './features/reportCards';
import { ReportListPage, ReportFormPage } from './features/reports';
import { RoleListPage, RoleFormPage, RolePermissionsPage } from './features/roles';
import { ScholarshipListPage, ScholarshipFormPage } from './features/scholarships';
import { SettingListPage, SettingFormPage } from './features/settings';
import { StudentListPage, StudentFormPage, StudentRecordPage } from './features/students';
import { SubjectListPage, SubjectFormPage } from './features/subjects';
import { TeacherListPage, TeacherFormPage, TeacherRecordPage } from './features/teachers';
import { TranscriptListPage, TranscriptFormPage } from './features/transcripts';
import { UserListPage, UserFormPage, UserRolesPage } from './features/users';

// Pages
import ForbiddenPage from './pages/ForbiddenPage';
import NotFoundPage from './pages/NotFound';
import ProfilePage from './pages/Profile';
import SuperAdminConsolePage from './pages/SuperAdminConsole';

// ============================================================================
// TEMA ACADEMIX — Paleta "Aurora Violeta Nocturna"
// Todos los tokens de color viven aquí. Cambiar estos valores reestiliza
// automáticamente toda la aplicación (tablas, formularios, tarjetas, menús).
// ============================================================================
const palette = {
  bg: '#0e0618',
  bgElevated: '#150a24',
  sidebar: '#110820',
  surface: 'rgba(255,255,255,0.04)',
  surfaceHover: 'rgba(255,255,255,0.07)',
  purple300: '#c4b5fd',
  purple400: '#a78bfa',
  purple500: '#7c3aed',
  purple600: '#6423c4',
  purple700: '#4b1c71',
  purple800: '#331f4d',
  purple900: '#241035',
  accent: '#c026d3',
  accentLight: '#e879f9',
  ink: '#f1eeff',
  slate: 'rgba(241,238,255,0.65)',
  slateLight: 'rgba(241,238,255,0.4)',
  mist: '#0e0618',
  line: 'rgba(167,139,250,0.14)',
  lineHover: 'rgba(167,139,250,0.32)',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#fb7185',
  info: '#60a5fa',
};

const gradientPrimary = `linear-gradient(135deg, ${palette.purple500} 0%, ${palette.purple700} 55%, ${palette.purple900} 100%)`;
const gradientAccent = `linear-gradient(135deg, ${palette.accent} 0%, ${palette.purple500} 100%)`;
const shadowSm = '0 1px 3px rgba(0, 0, 0, 0.45), 0 1px 2px rgba(124, 58, 237, 0.08)';
const shadowMd = '0 6px 20px rgba(0, 0, 0, 0.5), 0 2px 10px rgba(124, 58, 237, 0.16)';
const shadowLg = '0 20px 50px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(124, 58, 237, 0.22)';

const theme = createTheme({
  academix: { palette, gradientPrimary, gradientAccent, shadowSm, shadowMd, shadowLg },
  palette: {
    mode: 'dark',
    primary: {
      main: palette.purple500,
      light: palette.purple400,
      dark: palette.purple700,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: palette.accent,
      light: palette.accentLight,
      dark: '#8b1a95',
      contrastText: '#FFFFFF',
    },
    background: {
      default: palette.bg,
      paper: palette.bgElevated,
    },
    text: {
      primary: palette.ink,
      secondary: palette.slate,
      disabled: palette.slateLight,
    },
    divider: palette.line,
    success: {
      main: palette.success,
      light: '#6ee7b7',
      dark: '#10b981',
    },
    warning: {
      main: palette.warning,
      light: '#fcd34d',
      dark: '#d97706',
    },
    error: {
      main: palette.error,
      light: '#fda4af',
      dark: '#e11d48',
    },
    info: {
      main: palette.info,
      light: '#93c5fd',
      dark: '#3b82f6',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 300, letterSpacing: '-0.01em' },
    h2: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 300, letterSpacing: '-0.01em' },
    h3: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 400, letterSpacing: '-0.01em' },
    h4: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 400, letterSpacing: '-0.01em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 600, letterSpacing: '0.01em' },
    overline: { fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.1em', fontWeight: 500 },
  },
  shape: {
    borderRadius: 14,
  },
  shadows: [
    'none',
    shadowSm, shadowSm, shadowMd, shadowMd, shadowMd, shadowMd, shadowMd, shadowMd,
    shadowLg, shadowLg, shadowLg, shadowLg, shadowLg, shadowLg, shadowLg, shadowLg,
    shadowLg, shadowLg, shadowLg, shadowLg, shadowLg, shadowLg, shadowLg, shadowLg, shadowLg,
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: palette.bg,
        },
        '::selection': {
          backgroundColor: 'rgba(124,58,237,0.35)',
          color: '#FFFFFF',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(14,6,24,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${palette.line}`,
          boxShadow: 'none',
          color: palette.ink,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 600,
          paddingTop: 8,
          paddingBottom: 8,
        },
        containedPrimary: {
          backgroundImage: gradientPrimary,
          boxShadow: '0 4px 14px rgba(124, 58, 237, 0.45)',
          '&:hover': {
            boxShadow: '0 6px 18px rgba(124, 58, 237, 0.55)',
            backgroundImage: gradientPrimary,
            filter: 'brightness(1.1)',
          },
        },
        outlinedPrimary: {
          borderColor: palette.purple700,
          color: palette.purple300,
          '&:hover': {
            borderColor: palette.purple500,
            backgroundColor: 'rgba(124,58,237,0.08)',
          },
        },
        containedSecondary: {
          backgroundImage: gradientAccent,
          '&:hover': { backgroundImage: gradientAccent, filter: 'brightness(1.1)' },
        },
        text: {
          color: palette.purple300,
          '&:hover': { backgroundColor: 'rgba(124,58,237,0.08)' },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        primary: {
          backgroundImage: gradientPrimary,
          '&:hover': { backgroundImage: gradientPrimary, filter: 'brightness(1.1)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: shadowMd,
          border: `1px solid ${palette.line}`,
          backgroundColor: palette.surface,
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
          backgroundColor: palette.bgElevated,
        },
        outlined: {
          border: `1px solid ${palette.line}`,
          backgroundColor: palette.surface,
        },
        elevation1: { boxShadow: shadowSm, backgroundColor: palette.surface },
        elevation2: { boxShadow: shadowMd, backgroundColor: palette.surface },
        elevation3: { boxShadow: shadowMd, backgroundColor: palette.bgElevated },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.sidebar,
          backgroundImage: 'none',
          borderRight: `1px solid ${palette.line}`,
          color: palette.ink,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          marginLeft: 8,
          marginRight: 8,
          marginBottom: 2,
          width: 'auto',
          color: palette.slate,
          '&.Mui-selected': {
            backgroundColor: 'rgba(124,58,237,0.18)',
            border: '1px solid rgba(124,58,237,0.4)',
            color: palette.purple300,
            boxShadow: 'none',
            '& .MuiListItemIcon-root': { color: palette.purple300 },
            '&:hover': { backgroundColor: 'rgba(124,58,237,0.22)' },
          },
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.05)',
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: palette.purple400,
          minWidth: 40,
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: 'inherit',
        },
        secondary: {
          color: palette.slateLight,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
        colorPrimary: {
          backgroundImage: gradientPrimary,
          color: '#FFFFFF',
        },
        colorSecondary: {
          backgroundColor: 'rgba(192,38,211,0.18)',
          color: palette.accentLight,
        },
        outlined: {
          borderColor: palette.purple700,
          color: palette.slate,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 700,
        },
        colorDefault: {
          backgroundImage: gradientAccent,
          color: '#FFFFFF',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${palette.line}`,
          backgroundColor: palette.surface,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.03)',
          '& .MuiTableCell-root': {
            borderBottom: `2px solid ${palette.line}`,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(124,58,237,0.08)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: palette.purple300,
          fontWeight: 700,
          fontSize: '0.72rem',
          fontFamily: '"JetBrains Mono", monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        },
        root: {
          borderBottomColor: 'rgba(255,255,255,0.06)',
          color: palette.ink,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 3,
          backgroundImage: gradientPrimary,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          color: palette.slate,
          '&.Mui-selected': {
            color: palette.purple300,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: palette.slate,
          '&.Mui-focused': {
            color: palette.purple400,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: 'rgba(255,255,255,0.03)',
          color: palette.ink,
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: palette.purple500,
            borderWidth: 2,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: palette.purple700,
          },
        },
        notchedOutline: {
          borderColor: palette.line,
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: palette.purple400,
          },
          '&.Mui-checked + .MuiSwitch-track': {
            backgroundColor: palette.purple500,
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: palette.slateLight,
          '&.Mui-checked': { color: palette.purple400 },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: palette.slateLight,
          '&.Mui-checked': { color: palette.purple400 },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          height: 8,
          backgroundColor: 'rgba(255,255,255,0.08)',
        },
        bar: {
          borderRadius: 8,
          backgroundImage: gradientPrimary,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: shadowLg,
          backgroundColor: palette.bgElevated,
          backgroundImage: 'none',
          border: `1px solid ${palette.line}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          color: palette.purple300,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1a0f2e',
          color: palette.ink,
          borderRadius: 8,
          fontSize: '0.75rem',
          border: `1px solid ${palette.line}`,
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        colorError: {
          backgroundColor: palette.error,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: shadowMd,
          backgroundColor: palette.bgElevated,
          backgroundImage: 'none',
          border: `1px solid ${palette.line}`,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' },
          '&.Mui-selected': { backgroundColor: 'rgba(124,58,237,0.18)' },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: palette.line,
        },
      },
    },
  },
});

// The old metadata-only "/documents/new" route can't save (file_path/file_name
// are NOT NULL in the schema), so it redirects into the upload flow — this
// preserves any query string (e.g. ?studentId=X) across that redirect.
function DocumentsNewRedirect() {
  const location = useLocation();
  return <Navigate to={`/documents/upload${location.search}`} replace />;
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>
            <LanguageProvider>
              <Routes>
                {/* Rutas públicas */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forbidden" element={<ForbiddenPage />} />

                {/* Rutas protegidas */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />

                    {/* Academic History */}
                    <Route path="/academic-history" element={<AcademicHistoryListPage />} />
                    <Route path="/academic-history/new" element={<AcademicHistoryFormPage />} />
                    <Route path="/academic-history/:id" element={<AcademicHistoryFormPage />} />
                    <Route path="/academic-history/:id/edit" element={<AcademicHistoryFormPage />} />

                    {/* Academic Periods */}
                    <Route path="/academic-periods" element={<AcademicPeriodListPage />} />
                    <Route path="/academic-periods/new" element={<AcademicPeriodFormPage />} />
                    <Route path="/academic-periods/:id" element={<AcademicPeriodFormPage />} />
                    <Route path="/academic-periods/:id/edit" element={<AcademicPeriodFormPage />} />

                    {/* Academic Years */}
                    <Route path="/academic-years" element={<AcademicYearListPage />} />
                    <Route path="/academic-years/new" element={<AcademicYearFormPage />} />
                    <Route path="/academic-years/:id" element={<AcademicYearFormPage />} />
                    <Route path="/academic-years/:id/edit" element={<AcademicYearFormPage />} />

                    {/* Activity */}
                    <Route path="/activity" element={<ActivityListPage />} />
                    <Route path="/activity/:id" element={<ActivityFormPage />} />

                    {/* Assignments */}
                    <Route path="/assignments" element={<AssignmentListPage />} />
                    <Route path="/assignments/new" element={<AssignmentFormPage />} />
                    <Route path="/assignments/:id" element={<AssignmentFormPage />} />
                    <Route path="/assignments/:id/edit" element={<AssignmentFormPage />} />

                    {/* Attendance */}
                    <Route path="/attendance" element={<AttendanceListPage />} />
                    <Route path="/attendance/monthly/:assignmentId" element={<MonthlyAttendancePage />} />
                    <Route path="/attendance/new" element={<AttendanceFormPage />} />
                    <Route path="/attendance/:id" element={<AttendanceFormPage />} />
                    <Route path="/attendance/:id/edit" element={<AttendanceFormPage />} />

                    {/* Audit */}
                    <Route path="/audit" element={<AuditListPage />} />
                    <Route path="/audit/:id" element={<AuditFormPage />} />

                    {/* Branches */}
                    <Route path="/branches" element={<BranchListPage />} />
                    <Route path="/branches/new" element={<BranchFormPage />} />
                    <Route path="/branches/:id" element={<BranchFormPage />} />
                    <Route path="/branches/:id/edit" element={<BranchFormPage />} />

                    {/* Calendar */}
                    <Route path="/calendar" element={<CalendarListPage />} />
                    <Route path="/calendar/new" element={<CalendarFormPage />} />
                    <Route path="/calendar/:id" element={<CalendarFormPage />} />
                    <Route path="/calendar/:id/edit" element={<CalendarFormPage />} />

                    {/* Credits */}
                    <Route path="/credits" element={<CreditListPage />} />
                    <Route path="/credits/new" element={<CreditFormPage />} />
                    <Route path="/credits/:id" element={<CreditFormPage />} />
                    <Route path="/credits/:id/edit" element={<CreditFormPage />} />

                    {/* Documents */}
                    <Route path="/documents" element={<DocumentListPage />} />
                    {/* Documents always require a file (file_path/file_name are
                        NOT NULL in the schema), so the old metadata-only "new"
                        route now redirects into the upload flow instead of
                        rendering a form that could never save successfully. */}
                    <Route path="/documents/new" element={<DocumentsNewRedirect />} />
                    <Route path="/documents/upload" element={<DocumentFormPage />} />
                    <Route path="/documents/:id" element={<DocumentFormPage />} />
                    <Route path="/documents/:id/edit" element={<DocumentFormPage />} />

                    {/* GPA */}
                    <Route path="/gpa" element={<GpaListPage />} />
                    <Route path="/gpa/new" element={<GpaFormPage />} />
                    <Route path="/gpa/:id" element={<GpaFormPage />} />
                    <Route path="/gpa/:id/edit" element={<GpaFormPage />} />

                    {/* Grade Change Requests */}
                    <Route path="/grade-change-requests" element={<GradeChangeRequestListPage />} />
                    <Route path="/grade-change-requests/new" element={<GradeChangeRequestFormPage />} />
                    <Route path="/grade-change-requests/:id" element={<GradeChangeRequestFormPage />} />
                    <Route path="/grade-change-requests/:id/edit" element={<GradeChangeRequestFormPage />} />

                    {/* Grades */}
                    <Route path="/grades" element={<GradeListPage />} />
                    <Route path="/grades/new" element={<GradeFormPage />} />
                    <Route path="/grades/:id" element={<GradeFormPage />} />
                    <Route path="/grades/:id/edit" element={<GradeFormPage />} />

                    {/* Graduation */}
                    <Route path="/graduation" element={<GraduationListPage />} />
                    <Route path="/graduation/new" element={<GraduationFormPage />} />
                    <Route path="/graduation/:id" element={<GraduationFormPage />} />
                    <Route path="/graduation/:id/edit" element={<GraduationFormPage />} />

                    {/* Gransif */}
                    <Route path="/gransif" element={<GransifListPage />} />
                    <Route path="/gransif/new" element={<GransifFormPage />} />
                    <Route path="/gransif/:id" element={<GransifFormPage />} />
                    <Route path="/gransif/:id/edit" element={<GransifFormPage />} />

                    {/* Guardians */}
                    <Route path="/guardians" element={<GuardianListPage />} />
                    <Route path="/guardians/new" element={<GuardianFormPage />} />
                    <Route path="/guardians/:id" element={<GuardianFormPage />} />
                    <Route path="/guardians/:id/edit" element={<GuardianFormPage />} />

                    {/* Medical Records */}
                    <Route path="/medical-records" element={<MedicalRecordListPage />} />
                    <Route path="/medical-records/new" element={<MedicalRecordFormPage />} />
                    <Route path="/medical-records/:id" element={<MedicalRecordFormPage />} />
                    <Route path="/medical-records/:id/edit" element={<MedicalRecordFormPage />} />

                    {/* Permissions */}
                    <Route path="/permissions" element={<PermissionListPage />} />
                    <Route path="/permissions/new" element={<PermissionFormPage />} />
                    <Route path="/permissions/:id" element={<PermissionFormPage />} />
                    <Route path="/permissions/:id/edit" element={<PermissionFormPage />} />

                    {/* Previous Schools */}
                    <Route path="/previous-schools" element={<PreviousSchoolListPage />} />
                    <Route path="/previous-schools/new" element={<PreviousSchoolFormPage />} />
                    <Route path="/previous-schools/:id" element={<PreviousSchoolFormPage />} />
                    <Route path="/previous-schools/:id/edit" element={<PreviousSchoolFormPage />} />

                    {/* Progress Reports */}
                    <Route path="/progress-reports" element={<ProgressReportListPage />} />
                    <Route path="/progress-reports/new" element={<ProgressReportFormPage />} />
                    <Route path="/progress-reports/:id" element={<ProgressReportFormPage />} />
                    <Route path="/progress-reports/:id/edit" element={<ProgressReportFormPage />} />

                    {/* Report Cards */}
                    <Route path="/report-cards" element={<ReportCardListPage />} />
                    <Route path="/report-cards/new" element={<ReportCardFormPage />} />
                    <Route path="/report-cards/:id" element={<ReportCardFormPage />} />
                    <Route path="/report-cards/:id/edit" element={<ReportCardFormPage />} />

                    {/* Reports */}
                    <Route path="/reports" element={<ReportListPage />} />
                    <Route path="/reports/:id" element={<ReportFormPage />} />

                    {/* Roles */}
                    <Route path="/roles" element={<RoleListPage />} />
                    <Route path="/roles/new" element={<RoleFormPage />} />
                    <Route path="/roles/:id" element={<RoleFormPage />} />
                    <Route path="/roles/:id/edit" element={<RoleFormPage />} />
                    <Route path="/roles/:id/permissions" element={<RolePermissionsPage />} />

                    {/* Scholarships */}
                    <Route path="/scholarships" element={<ScholarshipListPage />} />
                    <Route path="/scholarships/new" element={<ScholarshipFormPage />} />
                    <Route path="/scholarships/:id" element={<ScholarshipFormPage />} />
                    <Route path="/scholarships/:id/edit" element={<ScholarshipFormPage />} />

                    {/* Settings */}
                    <Route path="/settings" element={<SettingListPage />} />
                    <Route path="/settings/edit" element={<SettingListPage />} />

                    {/* Students */}
                    <Route path="/students" element={<StudentListPage />} />
                    <Route path="/students/new" element={<StudentFormPage />} />
                    <Route path="/students/:id" element={<StudentRecordPage />} />
                    <Route path="/students/:id/edit" element={<StudentFormPage />} />
                    <Route path="/students/:id/record" element={<StudentRecordPage />} />

                    {/* Subjects */}
                    <Route path="/subjects" element={<SubjectListPage />} />
                    <Route path="/subjects/new" element={<SubjectFormPage />} />
                    <Route path="/subjects/:id" element={<SubjectFormPage />} />
                    <Route path="/subjects/:id/edit" element={<SubjectFormPage />} />

                    {/* Teachers */}
                    <Route path="/teachers" element={<TeacherListPage />} />
                    <Route path="/teachers/new" element={<TeacherFormPage />} />
                    <Route path="/teachers/:id" element={<TeacherRecordPage />} />
                    <Route path="/teachers/:id/edit" element={<TeacherFormPage />} />
                    <Route path="/teachers/:id/assignments" element={<TeacherRecordPage />} />

                    {/* Transcripts */}
                    <Route path="/transcripts" element={<TranscriptListPage />} />
                    <Route path="/transcripts/new" element={<TranscriptFormPage />} />
                    <Route path="/transcripts/:id" element={<TranscriptFormPage />} />
                    <Route path="/transcripts/:id/edit" element={<TranscriptFormPage />} />

                    {/* Users */}
                    <Route path="/users" element={<UserListPage />} />
                    <Route path="/users/new" element={<UserFormPage />} />
                    <Route path="/users/:id" element={<UserFormPage />} />
                    <Route path="/users/:id/edit" element={<UserFormPage />} />
                    <Route path="/users/:id/change-password" element={<UserFormPage />} />
                    <Route path="/users/:id/roles" element={<UserRolesPage />} />

                    {/* Profile */}
                    <Route path="/profile" element={<ProfilePage />} />

                    {/* Super Admin Console */}
                    <Route path="/admin" element={<SuperAdminConsolePage />} />
                  </Route>
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </LanguageProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;
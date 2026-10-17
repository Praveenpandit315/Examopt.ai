// client/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import { AdminLayout } from './layouts/AdminLayout';
import { StudentLayout } from './layouts/StudentLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { ExaminationsPage } from './pages/admin/ExaminationsPage';
import { RoomsPage } from './pages/admin/RoomsPage';
import { StudentGroupsPage } from './pages/admin/StudentGroupsPage';
import { DatesSlotsPage } from './pages/admin/DatesSlotsPage';
import { GenerateTimetablePage } from './pages/admin/GenerateTimetablePage';
import { ConflictAnalysisPage } from './pages/admin/ConflictAnalysisPage';
import { OptimizationLabPage } from './pages/admin/OptimizationLabPage';
import { ExamRescuePage } from './pages/admin/ExamRescuePage';
import { PublishReportsPage } from './pages/admin/PublishReportsPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { UniversityDataHubPage } from './pages/admin/UniversityDataHubPage';
import { ExamSessionBuilderPage } from './pages/admin/ExamSessionBuilderPage';

// Student Pages
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { StudentTimetablePage } from './pages/student/StudentTimetablePage';
import { StudentExamDetailsPage } from './pages/student/StudentExamDetailsPage';
import { StudentNotificationsPage } from './pages/student/StudentNotificationsPage';
import { StudentDownloadPage } from './pages/student/StudentDownloadPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';

// Route Guards
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function StudentRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'student') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="examinations" element={<ExaminationsPage />} />
            <Route path="groups" element={<StudentGroupsPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="slots" element={<DatesSlotsPage />} />
            <Route path="generate" element={<GenerateTimetablePage />} />
            <Route path="conflicts" element={<ConflictAnalysisPage />} />
            <Route path="optimization-lab" element={<OptimizationLabPage />} />
            <Route path="rescue" element={<ExamRescuePage />} />
            <Route path="publish" element={<PublishReportsPage />} />
            <Route path="data-hub" element={<UniversityDataHubPage />} />
            <Route path="session-builder" element={<ExamSessionBuilderPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Protected Student Routes */}
          <Route
            path="/student"
            element={
              <StudentRoute>
                <StudentLayout />
              </StudentRoute>
            }
          >
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboardPage />} />
            <Route path="timetable" element={<StudentTimetablePage />} />
            <Route path="details" element={<StudentExamDetailsPage />} />
            <Route path="notifications" element={<StudentNotificationsPage />} />
            <Route path="download" element={<StudentDownloadPage />} />
            <Route path="profile" element={<StudentProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

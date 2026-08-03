import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { DepartmentManagementPage } from './pages/admin/DepartmentManagementPage';
import { LeaderDashboardPage } from './pages/leader/LeaderDashboardPage';
import { LeaderTaskManagementPage } from './pages/leader/LeaderTaskManagementPage';
import { LeaderTeamPage } from './pages/leader/LeaderTeamPage';
import './index.css';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Array<'ADMIN' | 'LEADER' | 'EMPLOYEE'>;
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--color-page-bg)' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Đang tải hệ thống...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'LEADER') {
      return <Navigate to="/leader/dashboard" replace />;
    }
    return <Navigate to="/leader/tasks" replace />;
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { user } = useAuth();

  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (user?.role === 'LEADER') {
    return <Navigate to="/leader/dashboard" replace />;
  }
  return <Navigate to="/leader/tasks" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Default Route */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RootRedirect />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DepartmentManagementPage />
              </ProtectedRoute>
            }
          />

          {/* Leader & Team Routes */}
          <Route
            path="/leader/dashboard"
            element={
              <ProtectedRoute allowedRoles={['LEADER', 'ADMIN']}>
                <LeaderDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leader/tasks"
            element={
              <ProtectedRoute allowedRoles={['LEADER', 'EMPLOYEE', 'ADMIN']}>
                <LeaderTaskManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leader/team"
            element={
              <ProtectedRoute allowedRoles={['LEADER', 'ADMIN']}>
                <LeaderTeamPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

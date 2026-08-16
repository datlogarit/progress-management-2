import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { DepartmentManagementPage } from './pages/admin/DepartmentManagementPage';
import { TeamManagementPage } from './pages/admin/TeamManagementPage';
import { ProjectManagementPage } from './pages/admin/ProjectManagementPage';
import { LeaderTaskManagementPage } from './pages/leader/LeaderTaskManagementPage';
import { LeaderTeamPage } from './pages/leader/LeaderTeamPage';
import { EmployeeDashboardPage } from './pages/employee/EmployeeDashboardPage';
import './index.css';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: string[];
}

function ProtectedRoute({ children, requiredPermissions }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading, hasPermission } = useAuth();

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

  if (user?.isAdmin || user?.role === 'ADMIN') {
    return <>{children}</>;
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requiredPermissions.every(permission => hasPermission(permission));
    if (!hasAccess) {
      if (hasPermission('TASK_ASSIGN')) {
        return <Navigate to="/leader/dashboard" replace />;
      }
      if (hasPermission('TASK_READ')) {
        return <Navigate to="/home" replace />;
      }
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { user, hasPermission } = useAuth();

  if (user?.isAdmin || user?.role === 'ADMIN' || hasPermission('SYSTEM_MANAGE')) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/home" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" reverseOrder={false} />
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

          {/* Home / Workspace Main Route */}
          <Route
            path="/home"
            element={
              <ProtectedRoute requiredPermissions={['TASK_READ']}>
                <EmployeeDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredPermissions={['SYSTEM_MANAGE']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredPermissions={['USER_READ', 'USER_CREATE']}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute requiredPermissions={['DEPARTMENT_CREATE', 'DEPARTMENT_UPDATE']}>
                <DepartmentManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teams"
            element={
              <ProtectedRoute requiredPermissions={['DEPARTMENT_CREATE', 'DEPARTMENT_UPDATE']}>
                <TeamManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects"
            element={
              <ProtectedRoute requiredPermissions={['PROJECT_CREATE', 'PROJECT_UPDATE']}>
                <ProjectManagementPage />
              </ProtectedRoute>
            }
          />

          {/* Workspace Task & Team Routes */}
          <Route
            path="/leader/tasks"
            element={
              <ProtectedRoute requiredPermissions={['TASK_READ']}>
                <LeaderTaskManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leader/team"
            element={
              <ProtectedRoute requiredPermissions={['TASK_READ']}>
                <LeaderTeamPage />
              </ProtectedRoute>
            }
          />

          {/* Redirect aliases for backward compatibility */}
          <Route path="/employee/dashboard" element={<Navigate to="/home" replace />} />
          <Route path="/leader/dashboard" element={<Navigate to="/home" replace />} />
          <Route path="/employee/tasks" element={<Navigate to="/leader/tasks" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

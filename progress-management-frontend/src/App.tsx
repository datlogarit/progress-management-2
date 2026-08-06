import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { DepartmentManagementPage } from './pages/admin/DepartmentManagementPage';
import { ProjectManagementPage } from './pages/admin/ProjectManagementPage';
import { LeaderDashboardPage } from './pages/leader/LeaderDashboardPage';
import { LeaderTaskManagementPage } from './pages/leader/LeaderTaskManagementPage';
import { LeaderTeamPage } from './pages/leader/LeaderTeamPage';
import { EmployeeDashboardPage } from './pages/employee/EmployeeDashboardPage';
import { EmployeeTasksPage } from './pages/employee/EmployeeTasksPage';
import './index.css';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: string[];
}

function ProtectedRoute({ children, requiredPermissions }: ProtectedRouteProps) {
  const { isAuthenticated, loading, hasPermission } = useAuth();

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

  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requiredPermissions.every(permission => hasPermission(permission));
    if (!hasAccess) {
      if (hasPermission('SYSTEM_MANAGE')) {
        return <Navigate to="/admin/dashboard" replace />;
      }
      if (hasPermission('TASK_ASSIGN')) {
        return <Navigate to="/leader/dashboard" replace />;
      }
      return <Navigate to="/employee/dashboard" replace />;
    }
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { hasPermission } = useAuth();

  if (hasPermission('SYSTEM_MANAGE')) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (hasPermission('TASK_ASSIGN')) {
    return <Navigate to="/leader/dashboard" replace />;
  }
  return <Navigate to="/employee/dashboard" replace />;
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
            path="/admin/projects"
            element={
              <ProtectedRoute requiredPermissions={['PROJECT_CREATE', 'PROJECT_UPDATE']}>
                <ProjectManagementPage />
              </ProtectedRoute>
            }
          />

          {/* Leader & Team Routes */}
          <Route
            path="/leader/dashboard"
            element={
              <ProtectedRoute requiredPermissions={['TASK_ASSIGN']}>
                <LeaderDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leader/tasks"
            element={
              <ProtectedRoute requiredPermissions={['TASK_ASSIGN']}>
                <LeaderTaskManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leader/team"
            element={
              <ProtectedRoute requiredPermissions={['TASK_ASSIGN']}>
                <LeaderTeamPage />
              </ProtectedRoute>
            }
          />

          {/* Employee Routes */}
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute requiredPermissions={['TASK_READ']}>
                <EmployeeDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/tasks"
            element={
              <ProtectedRoute requiredPermissions={['TASK_READ']}>
                <EmployeeTasksPage />
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

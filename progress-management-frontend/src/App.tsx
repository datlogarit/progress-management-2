import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { DepartmentManagementPage } from './pages/admin/DepartmentManagementPage';
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
    // If not authorized for this role, redirect based on user role
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { user } = useAuth();

  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Placeholder for LEADER / EMPLOYEE dashboard view
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'var(--font-family-base)' }}>
      <div style={{ background: '#fff', padding: '32px', borderRadius: '12px', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
          Chào mừng, {user?.fullName}!
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Tài khoản: <strong>{user?.username}</strong> | Vai trò: <strong>{user?.role}</strong> | Phòng ban: {user?.departmentName || 'Chưa gán'}
        </p>
      </div>
    </div>
  );
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

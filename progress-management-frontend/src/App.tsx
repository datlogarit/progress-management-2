import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import './index.css';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

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

  return <>{children}</>;
}

function DashboardPlaceholder() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'var(--font-family-base)' }}>
      <div style={{ background: '#fff', padding: '32px', borderRadius: '12px', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
          Chào mừng, {user?.fullName}!
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
          Tài khoản: <strong>{user?.username}</strong> | Vai trò: <span style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>{user?.role}</span>
        </p>

        <button
          onClick={logout}
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--color-danger)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Đăng xuất
        </button>
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
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPlaceholder />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

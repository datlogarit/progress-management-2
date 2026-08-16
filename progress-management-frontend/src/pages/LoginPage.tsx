import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { loginApi } from '../services/authService';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  ShieldCheck, 
  CheckSquare, 
  Users, 
  Clock 
} from 'lucide-react';
import './LoginPage.css';

function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Input Validation
    if (!usernameOrEmail.trim()) {
      toast.error('Vui lòng nhập tên đăng nhập hoặc email!');
      return;
    }

    if (!password) {
      toast.error('Vui lòng nhập mật khẩu!');
      return;
    }

    setLoading(true);

    try {
      const response = await loginApi({
        usernameOrEmail: usernameOrEmail.trim(),
        password,
      });

      toast.success('Đăng nhập thành công!');
      login(response);

      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (err: any) {
      toast.error(err?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      {/* Background Subtle Patterns */}
      <div className="login-bg-grid" />
      <div className="login-bg-glow login-bg-glow-1" />
      <div className="login-bg-glow login-bg-glow-2" />

      <div className="login-card-wrapper">
        {/* Left Branding Panel */}
        <div className="login-brand-panel">
          <div className="brand-header">
            <div className="brand-logo-badge">
              <CheckSquare className="brand-logo-icon" />
            </div>
            <div className="brand-title-group">
              <span className="brand-sub-name">TASK MANAGEMENT</span>
              <h2 className="brand-name">Hệ thống Tiến độ Phòng ban</h2>
            </div>
          </div>

          <div className="brand-content">
            <h1 className="brand-headline">
              Quản lý công việc tập trung &amp; Theo dõi tiến độ thời gian thực
            </h1>
            <p className="brand-description">
              Hệ thống quản lý nội bộ dành cho Doanh nghiệp — Hỗ trợ tối ưu hóa quy trình phân công, theo dõi task và tương tác giữa các phòng ban.
            </p>

            <div className="brand-features">
              <div className="feature-item">
                <div className="feature-icon-box">
                  <ShieldCheck className="feature-icon" />
                </div>
                <div>
                  <h4 className="feature-title">Phân quyền 3 vai trò chuẩn hóa</h4>
                  <p className="feature-text">Admin quản trị, Leader giao task và Employee thực hiện</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-box">
                  <Clock className="feature-icon" />
                </div>
                <div>
                  <h4 className="feature-title">Theo dõi tiến độ Real-time</h4>
                  <p className="feature-text">Cập nhật trạng thái TODO, IN_PROGRESS, DONE tức thì</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-box">
                  <Users className="feature-icon" />
                </div>
                <div>
                  <h4 className="feature-title">Trao đổi &amp; Thông báo tập trung</h4>
                  <p className="feature-text">Bình luận trực tiếp trên từng task và nhận thông báo tức thời</p>
                </div>
              </div>
            </div>
          </div>

          <div className="brand-footer">
            <span>&copy; 2026 Internal Progress Management System v2.0</span>
          </div>
        </div>

        {/* Right Login Form Card */}
        <div className="login-form-panel">
          <div className="form-header">
            <h2 className="form-title">Đăng nhập Hệ thống</h2>
            <p className="form-subtitle">Cổng đăng nhập an toàn dành cho cán bộ nhân viên nội bộ</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {/* Input Username or Email */}
            <div className="input-group">
              <label htmlFor="usernameOrEmail" className="input-label">
                Tên đăng nhập hoặc Email <span className="required-star">*</span>
              </label>
              <div className="input-wrapper">
                <User className="field-icon" />
                <input
                  id="usernameOrEmail"
                  type="text"
                  className="form-input"
                  placeholder="Nhập username hoặc email..."
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="input-group">
              <label htmlFor="password" className="input-label">
                Mật khẩu <span className="required-star">*</span>
              </label>
              <div className="input-wrapper">
                <Lock className="field-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="form-options">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkmark" />
                <span className="checkbox-label">Ghi nhớ đăng nhập trên thiết bị này</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="spinner-icon" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <span>Đăng nhập</span>
              )}
            </button>
          </form>

          {/* Internal System Admin Notice (Explaining No Register Option) */}
          <div className="admin-notice-card">
            <ShieldCheck className="notice-icon" />
            <div className="notice-text">
              <strong>Lưu ý dành cho nhân viên:</strong>
              <p>
                Đây là hệ thống quản lý nội bộ. Tài khoản mới chỉ được tạo và gán quyền bởi <strong>Quản trị viên (Admin)</strong>. Nếu chưa có tài khoản hoặc quên mật khẩu, vui lòng liên hệ Bộ phận Quản trị/IT.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

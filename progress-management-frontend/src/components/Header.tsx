import { useAuth } from '../context/AuthContext';
import { LogOut, UserCircle, Shield } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="header-title-container">
        <h1 className="header-page-title">{title}</h1>
      </div>

      <div className="header-user-section">
        <div className="user-profile-badge">
          <div className="user-avatar">
            <UserCircle size={28} className="avatar-icon" />
          </div>
          <div className="user-info">
            <span className="user-name">{user?.fullName || user?.username}</span>
            <span className="user-role-tag">
              <Shield size={10} /> {user?.role}
            </span>
          </div>
        </div>

        <button 
          className="logout-btn" 
          onClick={logout} 
          title="Đăng xuất hệ thống"
        >
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}

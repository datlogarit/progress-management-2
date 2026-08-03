import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  CheckSquare, 
  ShieldCheck 
} from 'lucide-react';
import './Sidebar.css';

export function Sidebar() {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <CheckSquare size={22} className="logo-icon" />
        </div>
        <div className="brand-text">
          <span className="brand-title">PROGRESS SYSTEM</span>
          <span className="brand-badge">
            <ShieldCheck size={12} /> Admin Portal
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">QUẢN TRỊ NỘI BỘ</div>
        
        <NavLink 
          to="/admin/dashboard" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} className="nav-icon" />
          <span>Tổng quan Systems</span>
        </NavLink>

        <NavLink 
          to="/admin/users" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Users size={18} className="nav-icon" />
          <span>Quản lý Tài khoản</span>
        </NavLink>

        <NavLink 
          to="/admin/departments" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Building2 size={18} className="nav-icon" />
          <span>Quản lý Phòng ban</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          <span className="status-dot" />
          <span className="status-text">Backend Online (Port 8080)</span>
        </div>
      </div>
    </aside>
  );
}

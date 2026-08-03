import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  CheckSquare, 
  ShieldCheck,
  UserCheck,
  FolderKanban
} from 'lucide-react';
import './Sidebar.css';

export function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isLeader = user?.role === 'LEADER';

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <CheckSquare size={22} className="logo-icon" />
        </div>
        <div className="brand-text">
          <span className="brand-title">PROGRESS SYSTEM</span>
          <span className="brand-badge">
            <ShieldCheck size={12} /> {isAdmin ? 'Admin Portal' : isLeader ? 'Leader Portal' : 'Workspace'}
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {isAdmin && (
          <>
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
          </>
        )}

        {(isLeader || isAdmin) && (
          <>
            <div className="nav-section-title">QUẢN LÝ PHÒNG BAN</div>
            <NavLink 
              to="/leader/dashboard" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} className="nav-icon" />
              <span>Tổng quan Phòng ban</span>
            </NavLink>

            <NavLink 
              to="/leader/tasks" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <FolderKanban size={18} className="nav-icon" />
              <span>Quản lý Công việc</span>
            </NavLink>

            <NavLink 
              to="/leader/team" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <UserCheck size={18} className="nav-icon" />
              <span>Thành viên Nhóm</span>
            </NavLink>
          </>
        )}
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

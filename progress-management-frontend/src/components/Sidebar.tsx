import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjectsApi } from '../services/projectService';
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
  const { user, hasPermission } = useAuth();
  const isAdmin = hasPermission('SYSTEM_MANAGE');
  const [hasManagedProjects, setHasManagedProjects] = useState<boolean>(false);

  useEffect(() => {
    if (isAdmin || !user) {
      setHasManagedProjects(false);
      return;
    }

    let isMounted = true;
    getProjectsApi()
      .then(projects => {
        if (!isMounted) return;
        const isLeaderOfAny = (projects || []).some(p => 
          p.members?.some(m => String(m.id) === String(user.id) && String(m.projectRole).toUpperCase() === 'LEADER')
        );
        setHasManagedProjects(isLeaderOfAny);
      })
      .catch(err => {
        console.error('Error checking managed projects in Sidebar:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [user, isAdmin]);

  const isLeader = (isAdmin || hasManagedProjects);

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
              to="/admin/teams" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <UserCheck size={18} className="nav-icon" />
              <span>Quản lý Đội nhóm</span>
            </NavLink>

            <NavLink 
              to="/admin/departments" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Building2 size={18} className="nav-icon" />
              <span>Quản lý Phòng ban</span>
            </NavLink>

            <NavLink 
              to="/admin/projects" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <FolderKanban size={18} className="nav-icon" />
              <span>Quản lý Dự án</span>
            </NavLink>
          </>
        )}

        {!isAdmin && (
          <>
            <div className="nav-section-title">KHÔNG GIAN LÀM VIỆC</div>
            <NavLink 
              to="/home" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} className="nav-icon" />
              <span>Trang chủ</span>
            </NavLink>

            {hasManagedProjects && (
              <NavLink 
                to="/leader/tasks" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <FolderKanban size={18} className="nav-icon" />
                <span>Quản lý & Giao việc</span>
              </NavLink>
            )}

            {hasManagedProjects && (
              <NavLink 
                to="/leader/team" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <UserCheck size={18} className="nav-icon" />
                <span>Thành viên Nhóm</span>
              </NavLink>
            )}
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

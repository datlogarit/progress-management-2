import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { getAllUsersApi } from '../../services/userService';
import { getAllDepartmentsApi } from '../../services/departmentService';
import type { DepartmentDTO } from '../../services/departmentService';
import type { UserDTO } from '../../services/authService';
import { Users, Building2, Shield, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllTeamsApi } from '../../services/teamService';
import type { TeamDTO } from '../../services/teamService';
import { Modal } from '../../components/Modal';
import './AdminDashboardPage.css';

export function AdminDashboardPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [usersData, deptsData, teamsData] = await Promise.all([
          getAllUsersApi(),
          getAllDepartmentsApi(),
          getAllTeamsApi(),
        ]);
        setUsers(usersData);
        setDepartments(deptsData);
        setTeams(teamsData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Không thể tải dữ liệu tổng quan');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;

  return (
    <AdminLayout title="Tổng quan hệ thống">
      {loading ? (
        <div className="dashboard-loading">Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="dashboard-error-banner">{error}</div>
      ) : (
        <div className="dashboard-grid">
          {/* Stat Cards */}
          <div className="stat-cards-container">
            <div className="stat-card clickable" onClick={() => navigate('/admin/users')}>
              <div className="stat-icon-wrapper blue">
                <Users size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Tổng người dùng</span>
                <span className="stat-value">{totalUsers}</span>
                <span className="stat-subtext">Hoạt động: {activeUsers} tài khoản</span>
                {/* <span className="stat-trend up">
                  <TrendingUp size={12} /> Tăng 5%
                </span> */}
              </div>
            </div>

            <div className="stat-card clickable" onClick={() => navigate('/admin/teams')}>
              <div className="stat-icon-wrapper indigo">
                <Users size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Đội nhóm</span>
                <span className="stat-value">{teams.length}</span>
                <span className="stat-subtext">Đã phân bổ hệ thống</span>
                {/* <span className="stat-trend up">
                  <TrendingUp size={12} /> Tăng 12%
                </span> */}
              </div>
            </div>

            <div className="stat-card clickable" onClick={() => navigate('/admin/users')}>
              <div className="stat-icon-wrapper purple">
                <Shield size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Quản trị viên (Admin)</span>
                <span className="stat-value">{adminCount}</span>
                <span className="stat-subtext">Toàn quyền hệ thống</span>
                {/* <span className="stat-trend up">
                  <TrendingUp size={12} /> Ổn định
                </span> */}
              </div>
            </div>

            {/* <div className="stat-card">
              <div className="stat-icon-wrapper emerald">
                <UserCheck size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Trưởng phòng (Leader)</span>
                <span className="stat-value">{leaderCount}</span>
                <span className="stat-subtext">Quản lý công việc phòng ban</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper slate">
                <UserX size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Nhân viên (Employee)</span>
                <span className="stat-value">{employeeCount}</span>
                <span className="stat-subtext">Thực thi task phòng ban</span>
              </div>
            </div> */}
          </div>

          {/* Quick Actions & Recent Summary */}
          <div className="dashboard-content-split">
            {/* Left: Department List Preview */}
            <div className="dashboard-card-panel flex-2">
              <div className="panel-header">
                <h2 className="panel-title">Danh sách Phòng Ban</h2>
                <Link to="/admin/departments" className="action-link-btn">
                  Xem tất cả ({departments.length})
                </Link>
              </div>

              <div className="dept-summary-list">
                {departments.slice(0, 5).map((dept) => (
                  <div key={dept.id} className="dept-summary-item">
                    <div className="dept-item-icon">
                      <Building2 size={20} />
                    </div>
                    <div className="dept-item-details">
                      <span className="dept-item-name">{dept.name}</span>
                      <span className="dept-item-desc">{dept.description || 'Chưa có mô tả'}</span>
                    </div>
                    <div className="dept-item-pill">
                      {dept.userCount} nhân sự
                    </div>
                  </div>
                ))}
                {departments.length === 0 && (
                  <div className="empty-state-text">Chưa có phòng ban nào được tạo.</div>
                )}
              </div>
            </div>

            {/* Right: Recent Users */}
            <div className="dashboard-card-panel flex-3">
              <div className="panel-header">
                <h2 className="panel-title">Tài khoản mới cập nhật</h2>
                <Link to="/admin/users" className="action-link-btn primary">
                  <Plus size={16} /> Quản lý tài khoản
                </Link>
              </div>

              <div className="table-responsive">
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>Họ và tên</th>
                      <th>Username</th>
                      <th>Vai trò</th>
                      <th>Phòng ban</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 5).map((u) => (
                      <tr key={u.id}>
                        <td className="font-semibold">{u.fullName}</td>
                        <td className="text-secondary">{u.username}</td>
                        <td>
                          <span className={`badge-role ${u.role.toLowerCase()}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>{u.departmentName || 'Chưa gán'}</td>
                        <td>
                          <span className={`badge-status ${u.isActive ? 'active' : 'inactive'}`}>
                            {u.isActive ? 'Hoạt động' : 'Tạm khóa'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Modal */}
      <Modal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        title="Thông tin cơ bản các đội nhóm"
      >
        <div className="dept-summary-list" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
          {teams.map((team) => (
            <div key={team.id} className="dept-summary-item">
              <div className="dept-item-icon">
                <Users size={20} />
              </div>
              <div className="dept-item-details">
                <span className="dept-item-name">{team.name}</span>
                <span className="dept-item-desc">{team.description || 'Chưa có mô tả'}</span>
              </div>
            </div>
          ))}
          {teams.length === 0 && (
            <div className="empty-state-text" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
              Chưa có đội nhóm nào được tạo.
            </div>
          )}
        </div>
      </Modal>
    </AdminLayout>
  );
}

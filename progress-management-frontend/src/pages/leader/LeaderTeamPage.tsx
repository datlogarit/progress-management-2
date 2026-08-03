import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { getAllUsersApi, type UserDTO } from '../../services/userService';
import { getTasksApi, type TaskDTO } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import { Users, Mail, Shield, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import './LeaderTeamPage.css';

export function LeaderTeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<UserDTO[]>([]);
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [usersData, tasksData] = await Promise.all([
          user?.departmentId ? getAllUsersApi(user.departmentId) : getAllUsersApi(),
          getTasksApi(),
        ]);
        setMembers(usersData);
        setTasks(tasksData);
      } catch (err: any) {
        setError(err.message || 'Không thể tải thông tin thành viên');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-content">
        <Header title="Thành viên Nhóm / Phòng ban" />

        <main className="main-container">
          {error && <div className="page-error-banner">{error}</div>}

          <div className="team-header-card">
            <div>
              <h2>Danh sách Nhân viên {user?.departmentName ? `- Phòng ${user.departmentName}` : ''}</h2>
              <p>Tổng số: <strong>{members.length} thành viên</strong></p>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">Đang tải danh sách nhân viên...</div>
          ) : members.length === 0 ? (
            <div className="empty-state">Chưa có thành viên nào trong phòng ban.</div>
          ) : (
            <div className="team-grid">
              {members.map((member) => {
                const assignedTasks = tasks.filter(t => t.assignee?.id === member.id);
                const pending = assignedTasks.filter(t => t.status === 'PENDING').length;
                const inProgress = assignedTasks.filter(t => t.status === 'IN_PROGRESS').length;
                const completed = assignedTasks.filter(t => t.status === 'COMPLETED').length;

                return (
                  <div key={member.id} className="member-card">
                    <div className="member-card-header">
                      <div className="member-avatar">
                        <Users size={24} />
                      </div>
                      <div className="member-identity">
                        <h3 className="member-name">{member.fullName}</h3>
                        <div className="member-username">@{member.username}</div>
                      </div>
                      <span className={`role-badge ${member.role.toLowerCase()}`}>
                        <Shield size={10} /> {member.role}
                      </span>
                    </div>

                    <div className="member-email">
                      <Mail size={14} /> {member.email}
                    </div>

                    <div className="workload-summary-box">
                      <div className="summary-title">Tải lượng công việc:</div>
                      <div className="summary-stats">
                        <div className="stat-pill pending">
                          <AlertCircle size={12} /> {pending} chưa làm
                        </div>
                        <div className="stat-pill in-progress">
                          <Clock size={12} /> {inProgress} đang làm
                        </div>
                        <div className="stat-pill completed">
                          <CheckCircle2 size={12} /> {completed} xong
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

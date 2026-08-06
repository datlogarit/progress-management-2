import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { TaskCard } from '../../components/leader/TaskCard';
import { CreateEditTaskModal } from '../../components/leader/CreateEditTaskModal';
import { TaskDetailModal } from '../../components/leader/TaskDetailModal';
import { getTasksApi, createTaskApi, type TaskDTO } from '../../services/taskService';
import { getAllUsersApi, type UserDTO } from '../../services/userService';
import { getProjectsApi, type ProjectDTO } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';
import { 
  FolderKanban, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  TrendingUp, 
  Users
} from 'lucide-react';
import './LeaderDashboardPage.css';

export function LeaderDashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [departmentMembers, setDepartmentMembers] = useState<UserDTO[]>([]);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskDTO | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksData, usersData, projectsData] = await Promise.all([
        getTasksApi(),
        user?.departmentId ? getAllUsersApi(user.departmentId) : getAllUsersApi(),
        getProjectsApi(user?.departmentId || undefined)
      ]);
      setTasks(tasksData);
      setDepartmentMembers(usersData);
      setProjects(projectsData);
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreateTask = async (formData: any) => {
    await createTaskApi(formData);
    fetchData();
  };

  const pendingCount = tasks.filter(t => t.status === 'PENDING').length;
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;

  return (
    <div className="app-layout">
      <Sidebar />
      
      <div className="app-content">
        <Header title={`Tổng quan Phòng ban ${user?.departmentName ? `- ${user.departmentName}` : ''}`} />

        <main className="main-container">
          {error && <div className="page-error-banner">{error}</div>}

          {/* Quick Header Banner */}
          <div className="dashboard-banner">
            <div className="banner-text">
              <h2>Xin chào, {user?.fullName}! 👋</h2>
              <p>Dưới đây là tổng quan tiến độ công việc và hoạt động của phòng ban bạn.</p>
            </div>
            <button className="btn-create-task" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={18} /> Tạo Công việc mới
            </button>
          </div>

          {/* Stat Cards Grid */}
          <div className="stat-cards-grid">
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">TỔNG CÔNG VIỆC</span>
                <div className="stat-icon total"><FolderKanban size={20} /></div>
              </div>
              <div className="stat-value">{tasks.length}</div>
              <div className="stat-footer">
                <span className="stat-trend positive"><TrendingUp size={14} /> Tốc độ giao việc ổn định</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">CHƯA THỰC HIỆN</span>
                <div className="stat-icon pending"><AlertCircle size={20} /></div>
              </div>
              <div className="stat-value">{pendingCount}</div>
              <div className="stat-footer">
                <span className="stat-subtext">Cần phân công / bắt đầu</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">ĐANG THỰC HIỆN</span>
                <div className="stat-icon in-progress"><Clock size={20} /></div>
              </div>
              <div className="stat-value">{inProgressCount}</div>
              <div className="stat-footer">
                <span className="stat-subtext">Đang trong tiến trình</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">HOÀN THÀNH</span>
                <div className="stat-icon completed"><CheckCircle2 size={20} /></div>
              </div>
              <div className="stat-value">{completedCount}</div>
              <div className="stat-footer">
                <span className="stat-trend positive">
                  {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}% tỉ lệ hoàn thành
                </span>
              </div>
            </div>
          </div>

          {/* Recent Tasks & Quick Overview */}
          <div className="dashboard-content-grid">
            <div className="recent-tasks-section">
              <div className="section-header">
                <h3 className="section-title">Công việc gần đây</h3>
                <span className="task-count-badge">{tasks.length} task</span>
              </div>

              {loading ? (
                <div className="loading-state">Đang tải danh sách công việc...</div>
              ) : tasks.length === 0 ? (
                <div className="empty-state">
                  <p>Chưa có công việc nào trong phòng ban.</p>
                  <button className="btn-secondary-sm" onClick={() => setIsCreateModalOpen(true)}>
                    + Tạo task đầu tiên
                  </button>
                </div>
              ) : (
                <div className="tasks-grid">
                  {tasks.slice(0, 6).map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onViewDetail={(t) => setSelectedTask(t)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Team Quick Workload */}
            <div className="team-workload-sidebar">
              <div className="section-header">
                <h3 className="section-title">
                  <Users size={18} /> Thành viên phòng ban
                </h3>
              </div>

              <div className="team-members-list">
                {departmentMembers.length === 0 ? (
                  <p className="no-members">Chưa có thành viên nào.</p>
                ) : (
                  departmentMembers.map((member) => {
                    const assignedTasks = tasks.filter(t => t.assignee?.id === member.id);
                    const pendingTasksCount = assignedTasks.filter(t => t.status === 'PENDING').length;
                    const inProgressTasksCount = assignedTasks.filter(t => t.status === 'IN_PROGRESS').length;
                    const completedTasksCount = assignedTasks.filter(t => t.status === 'COMPLETED').length;
                    const isEmployee = member.role === 'EMPLOYEE';

                    return (
                      <div key={member.id} className="team-member-item">
                        <div className="member-info">
                          <div className="member-name">{member.fullName}</div>
                          <div className="member-role">{member.role}</div>
                        </div>
                        {isEmployee ? (
                          <div className="member-workload">
                            <span className="workload-count">{assignedTasks.length} task</span>
                            <span className="workload-progress">
                              ({completedTasksCount} xong, {inProgressTasksCount} đang làm, {pendingTasksCount} chưa làm)
                            </span>
                          </div>
                        ) : (
                          <div className="member-workload">
                            <span className="workload-role-badge">Trưởng phòng</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <CreateEditTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
        departmentMembers={departmentMembers}
        projects={projects}
      />

      <TaskDetailModal
        isOpen={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        departmentMembers={departmentMembers}
        onTaskUpdated={(updated) => {
          setSelectedTask(updated);
          setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        }}
      />
    </div>
  );
}

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
  Users,
  LayoutGrid,
  List as ListIcon,
  XCircle
} from 'lucide-react';
import './LeaderDashboardPage.css';

export function LeaderDashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [departmentMembers, setDepartmentMembers] = useState<UserDTO[]>([]);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'KANBAN' | 'TABLE'>('KANBAN');

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

  const managedProjects = (projects || []).filter(p => 
    user?.isAdmin || p.members?.some(m => String(m.id) === String(user?.id) && String(m.projectRole).toUpperCase() === 'LEADER')
  );
  const managedProjectIds = new Set(managedProjects.map(p => p.id));
  const managedTasks = tasks.filter(t => user?.isAdmin || (t.projectId && managedProjectIds.has(t.projectId)));

  const pendingCount = managedTasks.filter(t => t.status === 'PENDING').length;
  const inProgressCount = managedTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completedCount = managedTasks.filter(t => t.status === 'COMPLETED').length;

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
              <div className="stat-value">{managedTasks.length}</div>
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
                <span className="stat-label">ĐÃ HOÀN THÀNH</span>
                <div className="stat-icon completed"><CheckCircle2 size={20} /></div>
              </div>
              <div className="stat-value">{completedCount}</div>
              <div className="stat-footer">
                <span className="stat-subtext">Đã hoàn tất</span>
              </div>
            </div>
          </div>

          {/* Main Grid: Recent Tasks & Quick Actions */}
          <div className="dashboard-main-grid">
            <div className="recent-tasks-section">
              <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 className="section-title">Công việc gần đây</h3>
                  <span className="task-count-badge">{managedTasks.length} task</span>
                </div>
                <div className="view-mode-toggle">
                  <button 
                    className={`view-btn ${viewMode === 'KANBAN' ? 'active' : ''}`}
                    onClick={() => setViewMode('KANBAN')}
                  >
                    <LayoutGrid size={14} /> Kanban
                  </button>
                  <button 
                    className={`view-btn ${viewMode === 'TABLE' ? 'active' : ''}`}
                    onClick={() => setViewMode('TABLE')}
                  >
                    <ListIcon size={14} /> Danh sách
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="loading-state">Đang tải danh sách công việc...</div>
              ) : managedTasks.length === 0 ? (
                <div className="empty-state">
                  <p>Chưa có công việc nào trong phòng ban.</p>
                  <button className="btn-secondary-sm" onClick={() => setIsCreateModalOpen(true)}>
                    + Tạo task đầu tiên
                  </button>
                </div>
              ) : viewMode === 'KANBAN' ? (
                <div className="kanban-board" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <div className="kanban-column">
                    <div className="column-header pending">
                      <span className="col-title"><AlertCircle size={14} /> CHƯA LÀM</span>
                      <span className="col-count">{managedTasks.filter(t => t.status === 'PENDING').length}</span>
                    </div>
                    <div className="column-cards">
                      {managedTasks.filter(t => t.status === 'PENDING').slice(0, 4).map((task) => (
                        <TaskCard key={task.id} task={task} onViewDetail={(t) => setSelectedTask(t)} />
                      ))}
                    </div>
                  </div>

                  <div className="kanban-column">
                    <div className="column-header in-progress">
                      <span className="col-title"><Clock size={14} /> ĐANG LÀM</span>
                      <span className="col-count">{managedTasks.filter(t => t.status === 'IN_PROGRESS').length}</span>
                    </div>
                    <div className="column-cards">
                      {managedTasks.filter(t => t.status === 'IN_PROGRESS').slice(0, 4).map((task) => (
                        <TaskCard key={task.id} task={task} onViewDetail={(t) => setSelectedTask(t)} />
                      ))}
                    </div>
                  </div>

                  <div className="kanban-column">
                    <div className="column-header completed">
                      <span className="col-title"><CheckCircle2 size={14} /> HOÀN THÀNH</span>
                      <span className="col-count">{managedTasks.filter(t => t.status === 'COMPLETED').length}</span>
                    </div>
                    <div className="column-cards">
                      {managedTasks.filter(t => t.status === 'COMPLETED').slice(0, 4).map((task) => (
                        <TaskCard key={task.id} task={task} onViewDetail={(t) => setSelectedTask(t)} />
                      ))}
                    </div>
                  </div>

                  <div className="kanban-column">
                    <div className="column-header cancelled">
                      <span className="col-title"><XCircle size={14} /> ĐÃ HỦY</span>
                      <span className="col-count">{managedTasks.filter(t => t.status === 'CANCELLED').length}</span>
                    </div>
                    <div className="column-cards">
                      {managedTasks.filter(t => t.status === 'CANCELLED').slice(0, 4).map((task) => (
                        <TaskCard key={task.id} task={task} onViewDetail={(t) => setSelectedTask(t)} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="tasks-table-container">
                  <table className="tasks-table">
                    <thead>
                      <tr>
                        <th>Nhiệm vụ</th>
                        <th>Trạng thái</th>
                        <th>Hạn hoàn thành</th>
                      </tr>
                    </thead>
                    <tbody>
                      {managedTasks.slice(0, 8).map((task) => (
                        <tr key={task.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedTask(task)}>
                          <td className="task-title-cell">
                            <div className="title-text">{task.title}</div>
                            {task.description && (
                              <div className="desc-preview">
                                {task.description.length > 50 ? `${task.description.substring(0, 50)}...` : task.description}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className={`status-pill ${task.status.toLowerCase()}`}>
                              {task.status === 'COMPLETED' ? 'Hoàn thành' : task.status === 'IN_PROGRESS' ? 'Đang làm' : task.status === 'CANCELLED' ? 'Đã hủy' : 'Chưa làm'}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {task.dueDate ? new Date(task.dueDate).toLocaleString('vi-VN') : 'Không có'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                    const assignedTasks = managedTasks.filter(t => t.assignee?.id === member.id);
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

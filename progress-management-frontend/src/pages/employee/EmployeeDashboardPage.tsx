import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { TaskCard } from '../../components/leader/TaskCard';
import { TaskDetailModal } from '../../components/leader/TaskDetailModal';
import { getMyTasksApi, updateTaskStatusApi, type TaskDTO, type TaskStatus } from '../../services/taskService';
import { getProjectsApi, type ProjectDTO } from '../../services/projectService';
import { 
  getUserNotificationsApi, 
  markNotificationAsReadApi, 
  markAllNotificationsAsReadApi,
  type NotificationDTO 
} from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { 
  FolderKanban, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Bell,
  CheckCheck,
  Crown,
  UserCheck,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
  XCircle
} from 'lucide-react';
import './EmployeeDashboardPage.css';

export function EmployeeDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'KANBAN' | 'TABLE'>('KANBAN');

  // Modals state
  const [selectedTask, setSelectedTask] = useState<TaskDTO | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksData, projData, notifsData] = await Promise.all([
        getMyTasksApi(),
        getProjectsApi(),
        getUserNotificationsApi(),
      ]);
      setTasks(tasksData);
      setProjects(projData);
      setNotifications(notifsData);
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu nhiệm vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (taskId: number, status: TaskStatus) => {
    try {
      const updated = await updateTaskStatusApi(taskId, status);
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsReadApi(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsReadApi();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err: any) {
      console.error(err);
    }
  };

  // Projects where user is LEADER vs EMPLOYEE
  const managedProjects = projects.filter(p => 
    user?.isAdmin || p.members?.some(m => m.id === user?.id && m.projectRole === 'LEADER')
  );

  const employeeProjects = projects.filter(p => 
    p.members?.some(m => m.id === user?.id && m.projectRole === 'EMPLOYEE')
  );

  const pendingCount = tasks.filter(t => t.status === 'PENDING').length;
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const unreadNotifs = notifications.filter(n => !n.isRead);

  return (
    <div className="app-layout">
      <Sidebar />
      
      <div className="app-content">
        <Header title={`Không gian làm việc ${user?.departmentName ? `- ${user.departmentName}` : ''}`} />

        <main className="main-container">
          {error && <div className="page-error-banner">{error}</div>}

          {/* Quick Header Banner */}
          <div className="dashboard-banner employee-theme">
            <div className="banner-text">
              <h2>Xin chào, {user?.fullName}! 👋</h2>
              <p>
                {managedProjects.length > 0 
                  ? `Bạn đang là Trưởng dự án (${managedProjects.length} dự án) và Thành viên thực hiện (${employeeProjects.length} dự án).`
                  : 'Dưới đây là danh sách và tiến độ các công việc được giao cho bạn.'}
              </p>
            </div>
          </div>

          {/* SECTION 1: LEADER MANAGED PROJECTS (if user is Leader in any project) */}
          {managedProjects.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--color-text-primary)' }}>
                  <Crown size={20} style={{ color: '#eab308' }} />
                  Dự án bạn quản lý (Vai trò Leader)
                  <span className="task-count-badge" style={{ background: '#fef08a', color: '#854d0e', marginLeft: '0.5rem' }}>
                    {managedProjects.length} dự án
                  </span>
                </h3>
                <button 
                  className="btn-secondary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}
                  onClick={() => navigate('/leader/tasks')}
                >
                  Tạo Task & Giao việc <ChevronRight size={16} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {managedProjects.map(proj => (
                  <div 
                    key={proj.id} 
                    style={{
                      background: 'var(--color-card-bg, #ffffff)',
                      border: '1px solid var(--color-border, #e5e7eb)',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontWeight: 600, fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>{proj.name}</h4>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: proj.status === 'ACTIVE' ? '#dcfce7' : '#f3f4f6', color: proj.status === 'ACTIVE' ? '#166534' : '#4b5563' }}>
                          {proj.status === 'ACTIVE' ? 'Hoạt động' : proj.status}
                        </span>
                      </div>
                      {proj.description && (
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '0 0 1rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {proj.description}
                        </p>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border-subtle, #f3f4f6)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <UserCheck size={14} /> {proj.members ? proj.members.length : 0} thành viên
                      </span>
                      <button 
                        style={{ border: 'none', background: 'transparent', color: 'var(--color-primary, #4f46e5)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
                        onClick={() => navigate(`/leader/tasks?projectId=${proj.id}`)}
                      >
                        Quản lý công việc &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: EMPLOYEE ASSIGNED TASKS */}
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <FolderKanban size={20} className="text-accent" />
              Công việc được giao cho bạn (Vai trò Employee)
            </h3>
          </div>

          {/* Stat Cards Grid */}
          <div className="stat-cards-grid">
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">NHIỆM VỤ ĐƯỢC GIAO</span>
                <div className="stat-icon total"><FolderKanban size={20} /></div>
              </div>
              <div className="stat-value">{tasks.length}</div>
              <div className="stat-footer">
                <span className="stat-trend positive"><TrendingUp size={14} /> Nhiệm vụ cá nhân</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">CHƯA THỰC HIỆN</span>
                <div className="stat-icon pending"><AlertCircle size={20} /></div>
              </div>
              <div className="stat-value">{pendingCount}</div>
              <div className="stat-footer">
                <span className="stat-subtext">Cần bắt đầu xử lý</span>
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
                  {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}% hoàn thành
                </span>
              </div>
            </div>
          </div>

          {/* Recent Tasks & Notifications Sidebar */}
          <div className="dashboard-content-grid">
            <div className="recent-tasks-section">
              <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 className="section-title">Công việc được giao gần đây</h3>
                  <span className="task-count-badge">{tasks.length} task</span>
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
                <div className="loading-state">Đang tải công việc cá nhân...</div>
              ) : tasks.length === 0 ? (
                <div className="empty-state">
                  <p>Hiện tại bạn chưa được giao công việc nào.</p>
                </div>
              ) : viewMode === 'KANBAN' ? (
                <div className="kanban-board" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <div className="kanban-column">
                    <div className="column-header pending">
                      <span className="col-title"><AlertCircle size={14} /> CHƯA LÀM</span>
                      <span className="col-count">{tasks.filter(t => t.status === 'PENDING').length}</span>
                    </div>
                    <div className="column-cards">
                      {tasks.filter(t => t.status === 'PENDING').slice(0, 4).map((task) => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          onViewDetail={(t) => setSelectedTask(t)} 
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="kanban-column">
                    <div className="column-header in-progress">
                      <span className="col-title"><Clock size={14} /> ĐANG LÀM</span>
                      <span className="col-count">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</span>
                    </div>
                    <div className="column-cards">
                      {tasks.filter(t => t.status === 'IN_PROGRESS').slice(0, 4).map((task) => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          onViewDetail={(t) => setSelectedTask(t)} 
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="kanban-column">
                    <div className="column-header completed">
                      <span className="col-title"><CheckCircle2 size={14} /> HOÀN THÀNH</span>
                      <span className="col-count">{tasks.filter(t => t.status === 'COMPLETED').length}</span>
                    </div>
                    <div className="column-cards">
                      {tasks.filter(t => t.status === 'COMPLETED').slice(0, 4).map((task) => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          onViewDetail={(t) => setSelectedTask(t)} 
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="kanban-column">
                    <div className="column-header cancelled">
                      <span className="col-title"><XCircle size={14} /> ĐÃ HỦY</span>
                      <span className="col-count">{tasks.filter(t => t.status === 'CANCELLED').length}</span>
                    </div>
                    <div className="column-cards">
                      {tasks.filter(t => t.status === 'CANCELLED').slice(0, 4).map((task) => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          onViewDetail={(t) => setSelectedTask(t)} 
                          onStatusChange={handleStatusChange}
                        />
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
                      {tasks.slice(0, 8).map((task) => (
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

            {/* Notifications Sidebar */}
            <div className="notifications-sidebar">
              <div className="section-header">
                <h3 className="section-title">
                  <Bell size={18} /> Thông báo mới ({unreadNotifs.length})
                </h3>
                {unreadNotifs.length > 0 && (
                  <button className="btn-mark-all" onClick={handleMarkAllAsRead} title="Đọc tất cả">
                    <CheckCheck size={14} /> Đọc tất cả
                  </button>
                )}
              </div>

              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <p className="no-notifications">Chưa có thông báo nào.</p>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`notif-item ${notif.isRead ? 'read' : 'unread'}`}
                      onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                    >
                      <div className="notif-title">{notif.title}</div>
                      <div className="notif-message">{notif.message}</div>
                      <div className="notif-time">{new Date(notif.createdAt).toLocaleString('vi-VN')}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        departmentMembers={[]}
        onTaskUpdated={(updated) => {
          setSelectedTask(updated);
          setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        }}
      />
    </div>
  );
}

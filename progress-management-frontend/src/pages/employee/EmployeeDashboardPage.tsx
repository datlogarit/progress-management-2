import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { TaskCard } from '../../components/leader/TaskCard';
import { TaskDetailModal } from '../../components/leader/TaskDetailModal';
import { getMyTasksApi, updateTaskStatusApi, type TaskDTO, type TaskStatus } from '../../services/taskService';
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
  CheckCheck
} from 'lucide-react';
import './EmployeeDashboardPage.css';

export function EmployeeDashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [selectedTask, setSelectedTask] = useState<TaskDTO | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksData, notifsData] = await Promise.all([
        getMyTasksApi(),
        getUserNotificationsApi(),
      ]);
      setTasks(tasksData);
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

  const pendingCount = tasks.filter(t => t.status === 'PENDING').length;
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const unreadNotifs = notifications.filter(n => !n.isRead);

  return (
    <div className="app-layout">
      <Sidebar />
      
      <div className="app-content">
        <Header title={`Tổng quan Nhiệm vụ ${user?.departmentName ? `- ${user.departmentName}` : ''}`} />

        <main className="main-container">
          {error && <div className="page-error-banner">{error}</div>}

          {/* Quick Header Banner */}
          <div className="dashboard-banner employee-theme">
            <div className="banner-text">
              <h2>Xin chào, {user?.fullName}! 👋</h2>
              <p>Dưới đây là danh sách và tiến độ các công việc được giao cho bạn.</p>
            </div>
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
              <div className="section-header">
                <h3 className="section-title">Công việc được giao gần đây</h3>
                <span className="task-count-badge">{tasks.length} task</span>
              </div>

              {loading ? (
                <div className="loading-state">Đang tải công việc cá nhân...</div>
              ) : tasks.length === 0 ? (
                <div className="empty-state">
                  <p>Hiện tại bạn chưa được giao công việc nào.</p>
                </div>
              ) : (
                <div className="tasks-grid">
                  {tasks.slice(0, 6).map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onViewDetail={(t) => setSelectedTask(t)}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
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

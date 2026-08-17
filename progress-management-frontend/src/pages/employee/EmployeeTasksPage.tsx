import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { TaskCard } from '../../components/leader/TaskCard';
import { TaskDetailModal } from '../../components/leader/TaskDetailModal';
import { getMyTasksApi, updateTaskStatusApi, isTaskStatusLocked, type TaskDTO, type TaskStatus } from '../../services/taskService';
import toast from 'react-hot-toast';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  List as ListIcon, 
  Calendar, 
  User as UserIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import './EmployeeTasksPage.css';

export function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'KANBAN' | 'TABLE'>('KANBAN');

  // Modal state
  const [selectedTask, setSelectedTask] = useState<TaskDTO | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyTasksApi();
      setTasks(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách nhiệm vụ cá nhân');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusChange = async (taskId: number, status: TaskStatus) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (targetTask && isTaskStatusLocked(targetTask)) {
      toast.error('Không thể thay đổi trạng thái. Công việc đã hoàn thành quá 1 tiếng.');
      return;
    }
    if (status === 'COMPLETED' && targetTask?.status !== 'COMPLETED') {
      const confirmed = window.confirm(
        'Bạn đã chắc chắn muốn chuyển công việc sang trạng thái Hoàn thành? Bạn sẽ không thể thay đổi trạng thái sau 1 tiếng.'
      );
      if (!confirmed) return;
    }

    try {
      const updated = await updateTaskStatusApi(taskId, status);
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      toast.success('Cập nhật trạng thái thành công');
    } catch (err: any) {
      toast.error(err.message || 'Không thể cập nhật trạng thái');
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchKeyword.toLowerCase()));
    
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusPill = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="status-pill completed">Hoàn thành</span>;
      case 'IN_PROGRESS':
        return <span className="status-pill in_progress">Đang làm</span>;
      case 'CANCELLED':
        return <span className="status-pill cancelled">Đã hủy</span>;
      case 'PENDING':
      default:
        return <span className="status-pill pending">Chưa làm</span>;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      
      <div className="app-content">
        <Header title="Nhiệm vụ được giao" />

        <main className="main-container">
          {error && <div className="page-error-banner">{error}</div>}

          {/* Task Action & Filter Bar */}
          <div className="task-action-bar">
            <div className="search-filter-group">
              <div className="search-box">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Tìm theo tên nhiệm vụ..." 
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </div>

              <div className="filter-select-wrapper">
                <Filter size={14} />
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING">Chưa làm</option>
                  <option value="IN_PROGRESS">Đang làm</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>
            </div>

            <div className="right-action-group">
              {/* View mode switch */}
              <div className="view-mode-toggle">
                <button 
                  className={`view-btn ${viewMode === 'KANBAN' ? 'active' : ''}`}
                  onClick={() => setViewMode('KANBAN')}
                >
                  <LayoutGrid size={16} /> Kanban
                </button>
                <button 
                  className={`view-btn ${viewMode === 'TABLE' ? 'active' : ''}`}
                  onClick={() => setViewMode('TABLE')}
                >
                  <ListIcon size={16} /> Danh sách
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          {loading ? (
            <div className="loading-state">Đang tải nhiệm vụ...</div>
          ) : viewMode === 'KANBAN' ? (
            /* KANBAN BOARD VIEW */
            <div className="kanban-board">
              {/* Column: PENDING */}
              <div className="kanban-column">
                <div className="column-header pending">
                  <span className="col-title"><AlertCircle size={16} /> CHƯA LÀM</span>
                  <span className="col-count">{filteredTasks.filter(t => t.status === 'PENDING').length}</span>
                </div>
                <div className="column-cards">
                  {filteredTasks.filter(t => t.status === 'PENDING').map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onViewDetail={t => setSelectedTask(t)}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>

              {/* Column: IN_PROGRESS */}
              <div className="kanban-column">
                <div className="column-header in-progress">
                  <span className="col-title"><Clock size={16} /> ĐANG LÀM</span>
                  <span className="col-count">{filteredTasks.filter(t => t.status === 'IN_PROGRESS').length}</span>
                </div>
                <div className="column-cards">
                  {filteredTasks.filter(t => t.status === 'IN_PROGRESS').map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onViewDetail={t => setSelectedTask(t)}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>

              {/* Column: COMPLETED */}
              <div className="kanban-column">
                <div className="column-header completed">
                  <span className="col-title"><CheckCircle2 size={16} /> HOÀN THÀNH</span>
                  <span className="col-count">{filteredTasks.filter(t => t.status === 'COMPLETED').length}</span>
                </div>
                <div className="column-cards">
                  {filteredTasks.filter(t => t.status === 'COMPLETED').map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onViewDetail={t => setSelectedTask(t)}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>

              {/* Column: CANCELLED */}
              <div className="kanban-column">
                <div className="column-header cancelled">
                  <span className="col-title"><XCircle size={16} /> ĐÃ HỦY</span>
                  <span className="col-count">{filteredTasks.filter(t => t.status === 'CANCELLED').length}</span>
                </div>
                <div className="column-cards">
                  {filteredTasks.filter(t => t.status === 'CANCELLED').map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onViewDetail={t => setSelectedTask(t)}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="tasks-table-container">
              <table className="tasks-table">
                <thead>
                  <tr>
                    <th>Nhiệm vụ</th>
                    <th>Dự án</th>
                    <th>Trạng thái</th>
                    <th>Người giao</th>
                    <th>Hạn hoàn thành</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)' }}>
                        Không tìm thấy nhiệm vụ nào.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map(task => (
                      <tr key={task.id}>
                        <td className="task-title-cell" onClick={() => setSelectedTask(task)}>
                          <div className="title-text">{task.title}</div>
                          {task.description && (
                            <div className="desc-preview">
                              {task.description.length > 60 ? `${task.description.substring(0, 60)}...` : task.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="task-project-tag">{task.projectName || '-'}</span>
                        </td>
                        <td>{getStatusPill(task.status)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <UserIcon size={14} /> {task.createdBy.fullName}
                          </div>
                        </td>
                        <td>
                          {task.dueDate ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar size={14} /> {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                            </div>
                          ) : '-'}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button onClick={() => setSelectedTask(task)} title="Xem chi tiết & Thảo luận">
                              Chi tiết
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
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

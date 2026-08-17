import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { TaskCard } from '../../components/leader/TaskCard';
import { CreateEditTaskModal } from '../../components/leader/CreateEditTaskModal';
import { TaskDetailModal } from '../../components/leader/TaskDetailModal';
import { 
  getTasksApi, 
  createTaskApi, 
  updateTaskApi, 
  updateTaskStatusApi, 
  cancelTaskApi,
  type TaskDTO
} from '../../services/taskService';
import { getAllUsersApi, type UserDTO } from '../../services/userService';
import { getProjectsApi, type ProjectDTO } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Kanban, 
  List as ListIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Edit2,
  Eye
} from 'lucide-react';
import './LeaderTaskManagementPage.css';

export function LeaderTaskManagementPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [departmentMembers, setDepartmentMembers] = useState<UserDTO[]>([]);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Views
  const [viewMode, setViewMode] = useState<'KANBAN' | 'TABLE'>('KANBAN');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('ALL');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | 'LEADER' | 'EMPLOYEE'>('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);
  const [detailTask, setDetailTask] = useState<TaskDTO | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const taskIdParam = searchParams.get('taskId');
  const projectIdParam = searchParams.get('projectId');
  const commentIdParam = searchParams.get('commentId'); // Pass to modal later

  useEffect(() => {
    if (projectIdParam) {
      setSelectedProjectFilter(projectIdParam);
    }
  }, [projectIdParam]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksData, usersData, projectsData] = await Promise.all([
        getTasksApi(),
        user?.departmentId ? getAllUsersApi(user.departmentId) : getAllUsersApi(),
        getProjectsApi()
      ]);
      setTasks(tasksData);
      setDepartmentMembers(usersData);
      setProjects(projectsData);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách công việc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (tasks.length > 0 && taskIdParam) {
      const taskToOpen = tasks.find(t => t.id === Number(taskIdParam));
      if (taskToOpen && (!detailTask || detailTask.id !== taskToOpen.id)) {
        setDetailTask(taskToOpen);
      }
    }
  }, [tasks, taskIdParam]);

  const handleCloseDetailModal = () => {
    setDetailTask(null);
    if (taskIdParam) {
      searchParams.delete('taskId');
      searchParams.delete('commentId');
      setSearchParams(searchParams);
    }
  };

  const handleCreateOrUpdateTask = async (formData: any) => {
    try {
      if (editingTask) {
        const updated = await updateTaskApi(editingTask.id, formData);
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        toast.success('Cập nhật công việc thành công!');
      } else {
        await createTaskApi(formData);
        toast.success('Tạo công việc mới thành công!');
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi thao tác công việc');
    }
  };

  const handleCancelTask = async (task: TaskDTO) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy công việc "${task.title}"?`)) return;
    try {
      const updated = await cancelTaskApi(task.id);
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
      toast.success(`Đã hủy công việc "${task.title}"`);
    } catch (err: any) {
      toast.error(err.message || 'Không thể hủy công việc');
    }
  };

  // Managed projects filter
  const managedProjects = (projects || []).filter(p => 
    user?.isAdmin || p.members?.some(m => String(m.id) === String(user?.id) && String(m.projectRole).toUpperCase() === 'LEADER')
  );
  const managedProjectIds = new Set(managedProjects.map(p => p.id));

  // Filter tasks: Only tasks of projects where user is LEADER (or isAdmin)
  const filteredTasks = tasks.filter((t) => {
    const isManaged = Boolean(user?.isAdmin || (t.projectId && managedProjectIds.has(t.projectId)));
    if (!isManaged) return false;

    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
    const matchesAssignee = selectedAssignee === 'ALL' || 
      (selectedAssignee === 'UNASSIGNED' ? !t.assignee : t.assignee?.id === Number(selectedAssignee));
    const matchesProject = selectedProjectFilter === 'ALL' || t.projectId === Number(selectedProjectFilter);

    return matchesSearch && matchesStatus && matchesAssignee && matchesProject;
  });

  const pendingTasks = filteredTasks.filter(t => t.status === 'PENDING');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'IN_PROGRESS');
  const completedTasks = filteredTasks.filter(t => t.status === 'COMPLETED');
  const cancelledTasks = filteredTasks.filter(t => t.status === 'CANCELLED');

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-content">
        <Header title="Quản lý & Giao việc" />

        <main className="main-container">
          {error && <div className="page-error-banner">{error}</div>}

          {/* Action & Filter Bar */}
          <div className="task-action-bar">
            <div className="search-filter-group">
              <div className="search-box">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm kiếm công việc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="filter-select-wrapper">
                <Filter size={16} className="filter-icon" />
                <select value={selectedProjectFilter} onChange={(e) => setSelectedProjectFilter(e.target.value)}>
                  <option value="ALL">Tất cả dự án quản lý</option>
                  {managedProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-select-wrapper">
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING">Chưa làm</option>
                  <option value="IN_PROGRESS">Đang làm</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>

              <div className="filter-select-wrapper">
                <select value={selectedRoleFilter} onChange={(e) => setSelectedRoleFilter(e.target.value as any)}>
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="LEADER">Dự án tôi quản lý (Leader)</option>
                  <option value="EMPLOYEE">Công việc giao cho tôi (Employee)</option>
                </select>
              </div>

              <div className="filter-select-wrapper">
                <select value={selectedAssignee} onChange={(e) => setSelectedAssignee(e.target.value)}>
                  <option value="ALL">Tất cả người thực hiện</option>
                  <option value="UNASSIGNED">Chưa phân công</option>
                  {departmentMembers
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="right-action-group">
              <div className="view-mode-toggle">
                <button
                  className={`view-btn ${viewMode === 'KANBAN' ? 'active' : ''}`}
                  onClick={() => setViewMode('KANBAN')}
                  title="Xem dạng Bảng Kanban"
                >
                  <Kanban size={16} /> Kanban
                </button>
                <button
                  className={`view-btn ${viewMode === 'TABLE' ? 'active' : ''}`}
                  onClick={() => setViewMode('TABLE')}
                  title="Xem dạng Danh sách"
                >
                  <ListIcon size={16} /> Danh sách
                </button>
              </div>

              {!user?.isAdmin && (
                <button className="btn-primary-add" onClick={() => { setEditingTask(null); setIsCreateModalOpen(true); }}>
                  <Plus size={18} /> Tạo Task Mới
                </button>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          {loading ? (
            <div className="loading-state">Đang tải công việc...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state">
              <p>Không tìm thấy công việc nào phù hợp với bộ lọc.</p>
            </div>
          ) : viewMode === 'KANBAN' ? (
            /* Kanban Board View */
            <div className="kanban-board">
              <div className="kanban-column">
                <div className="column-header pending">
                  <div className="col-title">
                    <AlertCircle size={16} /> Chưa thực hiện
                  </div>
                  <span className="col-count">{pendingTasks.length}</span>
                </div>
                <div className="column-cards">
                  {pendingTasks.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onViewDetail={(task) => setDetailTask(task)}
                      onEdit={(task) => { setEditingTask(task); setIsCreateModalOpen(true); }}
                      onCancel={handleCancelTask}
                    />
                  ))}
                </div>
              </div>

              <div className="kanban-column">
                <div className="column-header in-progress">
                  <div className="col-title">
                    <Clock size={16} /> Đang thực hiện
                  </div>
                  <span className="col-count">{inProgressTasks.length}</span>
                </div>
                <div className="column-cards">
                  {inProgressTasks.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onViewDetail={(task) => setDetailTask(task)}
                      onEdit={(task) => { setEditingTask(task); setIsCreateModalOpen(true); }}
                      onCancel={handleCancelTask}
                    />
                  ))}
                </div>
              </div>

              <div className="kanban-column">
                <div className="column-header completed">
                  <div className="col-title">
                    <CheckCircle2 size={16} /> Hoàn thành
                  </div>
                  <span className="col-count">{completedTasks.length}</span>
                </div>
                <div className="column-cards">
                  {completedTasks.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onViewDetail={(task) => setDetailTask(task)}
                      onEdit={(task) => { setEditingTask(task); setIsCreateModalOpen(true); }}
                      onCancel={handleCancelTask}
                    />
                  ))}
                </div>
              </div>

              <div className="kanban-column">
                <div className="column-header cancelled">
                  <div className="col-title">
                    <XCircle size={16} /> Đã hủy
                  </div>
                  <span className="col-count">{cancelledTasks.length}</span>
                </div>
                <div className="column-cards">
                  {cancelledTasks.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onViewDetail={(task) => setDetailTask(task)}
                      onEdit={(task) => { setEditingTask(task); setIsCreateModalOpen(true); }}
                      onCancel={handleCancelTask}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Table View */
            <div className="tasks-table-container">
              <table className="tasks-table">
                <thead>
                  <tr>
                    <th>Tên công việc</th>
                    <th>Dự án</th>
                    <th>Trạng thái</th>
                    <th>Mức ưu tiên</th>
                    <th>Người thực hiện</th>
                    <th>Hạn hoàn thành</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((t) => (
                    <tr key={t.id}>
                      <td className="task-title-cell" onClick={() => setDetailTask(t)}>
                        <div className="title-text">{t.title}</div>
                        {t.description && <div className="desc-preview">{t.description}</div>}
                      </td>
                      <td>
                        <span className="task-project-tag">{t.projectName || '-'}</span>
                      </td>
                      <td>
                        <span className={`status-pill ${t.status.toLowerCase()}`}>
                          {t.status === 'COMPLETED' ? 'Hoàn thành' : t.status === 'IN_PROGRESS' ? 'Đang làm' : t.status === 'PENDING' ? 'Chưa làm' : 'Đã hủy'}
                        </span>
                      </td>
                      <td>
                        <span className={`priority-tag ${t.priority.toLowerCase()}`}>{t.priority}</span>
                      </td>
                      <td>{t.assignee ? t.assignee.fullName : <span className="unassigned-text">Chưa giao</span>}</td>
                      <td>{t.dueDate ? new Date(t.dueDate).toLocaleDateString('vi-VN') : '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions">
                          <button onClick={() => setDetailTask(t)} title="Chi tiết"><Eye size={16} /></button>
                          <button onClick={() => { setEditingTask(t); setIsCreateModalOpen(true); }} title="Sửa"><Edit2 size={16} /></button>
                          <button 
                            onClick={() => handleCancelTask(t)} 
                            className="delete-btn" 
                            title="Hủy task"
                            disabled={t.status === 'CANCELLED'}
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateEditTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setEditingTask(null); }}
        onSubmit={handleCreateOrUpdateTask}
        initialTask={editingTask}
        departmentMembers={departmentMembers}
        projects={projects}
      />

      <TaskDetailModal
        isOpen={detailTask !== null}
        onClose={handleCloseDetailModal}
        task={detailTask}
        departmentMembers={departmentMembers}
        onTaskUpdated={(updated) => {
          setDetailTask(updated);
          setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        }}
        highlightedCommentId={commentIdParam ? Number(commentIdParam) : undefined}
      />
    </div>
  );
}

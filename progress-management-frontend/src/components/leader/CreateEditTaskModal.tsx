import { useState, useEffect } from 'react';
import type { TaskDTO, TaskPriority, TaskStatus } from '../../services/taskService';
import type { UserDTO } from '../../services/authService';
import type { ProjectDTO } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../Modal';
import './CreateEditTaskModal.css';

interface CreateEditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  initialTask?: TaskDTO | null;
  departmentMembers: UserDTO[];
  projects: ProjectDTO[];
}

export function CreateEditTaskModal({
  isOpen,
  onClose,
  onSubmit,
  initialTask,
  departmentMembers,
  projects,
}: CreateEditTaskModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('PENDING');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter projects to only those where the current user can create/manage tasks (is LEADER or isAdmin)
  const availableProjects = (projects || []).filter((p) => {
    if (user?.isAdmin) return true;
    if (initialTask && String(p.id) === String(initialTask.projectId)) return true;
    return p.members?.some(
      (m) => String(m.id) === String(user?.id) && String(m.projectRole).toUpperCase() === 'LEADER'
    );
  });

  const selectedProject = projects.find(p => String(p.id) === String(projectId));
  const combinedMembersMap = new Map<number, UserDTO>();

  (departmentMembers || []).forEach(m => combinedMembersMap.set(m.id, m));
  (selectedProject?.members || []).forEach(m => {
    if (!combinedMembersMap.has(m.id)) {
      combinedMembersMap.set(m.id, {
        id: m.id,
        username: m.username,
        fullName: m.fullName,
        email: m.email,
        role: (m.projectRole || 'EMPLOYEE') as any,
        permissions: [],
        departmentId: selectedProject?.departmentId || null,
        departmentName: selectedProject?.departmentName || null,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      });
    }
  });

  const availableAssignees = Array.from(combinedMembersMap.values()).filter(
    (m) => String(m.id) !== String(user?.id)
  );

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setPriority(initialTask.priority);
      setStatus(initialTask.status);
      setDueDate(initialTask.dueDate ? new Date(initialTask.dueDate).toISOString().slice(0, 16) : '');
      setAssigneeId(initialTask.assignee ? String(initialTask.assignee.id) : '');
      setProjectId(initialTask.projectId ? String(initialTask.projectId) : '');
    } else if (isOpen) {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setStatus('PENDING');
      setDueDate('');
      setAssigneeId('');
      if (availableProjects && availableProjects.length > 0) {
        if (!projectId || !availableProjects.some(p => String(p.id) === String(projectId))) {
          setProjectId(String(availableProjects[0].id));
        }
      } else {
        setProjectId('');
      }
    }
    setError(null);
  }, [initialTask, isOpen, projects, user]);

  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề công việc');
      return;
    }
    
    if (!projectId) {
      setError('Vui lòng chọn dự án cho công việc');
      return;
    }

    if (dueDate) {
      const selectedTime = new Date(dueDate).getTime();
      if (selectedTime <= Date.now()) {
        setError('Hạn hoàn thành phải ở thời điểm trong tương lai (sau thời điểm hiện tại)');
        return;
      }
    }

    if (assigneeId && String(assigneeId) === String(user?.id)) {
      setError('Trưởng phòng không thể tự giao công việc cho chính mình');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status: initialTask ? status : undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        assigneeId: assigneeId ? Number(assigneeId) : null,
        projectId: Number(projectId),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Thao tác thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTask ? 'Chỉnh sửa Công việc' : 'Tạo mới Công việc'}
    >
      <form onSubmit={handleSubmit} className="task-form">
        {error && <div className="form-error-alert">{error}</div>}

        <div className="form-group">
          <label htmlFor="task-title">Tiêu đề công việc <span className="required">*</span></label>
          <input
            id="task-title"
            type="text"
            className="form-control"
            placeholder="Ví dụ: Thiết kế cơ sở dữ liệu module Báo cáo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading || Boolean(initialTask)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="task-desc">Mô tả công việc</label>
          <textarea
            id="task-desc"
            className="form-control textarea"
            rows={4}
            placeholder="Mô tả chi tiết các yêu cầu, kết quả cần đạt..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading || Boolean(initialTask)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="task-project">Thuộc dự án <span className="required">*</span></label>
          <select
            id="task-project"
            className="form-control"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            disabled={loading || Boolean(initialTask) || availableProjects.length === 0}
          >
            {availableProjects.length === 0 ? (
              <option value="">-- Bạn không quản lý dự án nào --</option>
            ) : (
              <>
                <option value="">-- Chọn dự án --</option>
                {availableProjects.map((p) => {
                  const isLeaderOfProj = p.members?.some(
                    m => String(m.id) === String(user?.id) && String(m.projectRole).toUpperCase() === 'LEADER'
                  ) || user?.isAdmin;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} {isLeaderOfProj ? '(Trưởng dự án)' : ''}
                    </option>
                  );
                })}
              </>
            )}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="task-priority">Mức độ ưu tiên</label>
            <select
              id="task-priority"
              className="form-control"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              disabled={loading || Boolean(initialTask)}
            >
              <option value="LOW">Thấp</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HIGH">Cao</option>
              <option value="URGENT">Khẩn cấp</option>
            </select>
          </div>

          {initialTask && (
            <div className="form-group half">
              <label htmlFor="task-status">Trạng thái</label>
              <select
                id="task-status"
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                disabled={loading || Boolean(initialTask)}
              >
                <option value="PENDING">Chưa làm</option>
                <option value="IN_PROGRESS">Đang làm</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="task-assignee">Giao cho nhân viên</label>
            <select
              id="task-assignee"
              className="form-control"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Chọn nhân viên thực hiện --</option>
              {availableAssignees.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName} (@{member.username})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group half">
            <label htmlFor="task-duedate">Hạn hoàn thành</label>
            <input
              id="task-duedate"
              type="datetime-local"
              className="form-control"
              min={getMinDateTime()}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Đang lưu...' : initialTask ? 'Cập nhật' : 'Tạo mới'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

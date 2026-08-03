import { useState, useEffect } from 'react';
import type { TaskDTO, TaskPriority, TaskStatus } from '../../services/taskService';
import type { UserDTO } from '../../services/authService';
import { Modal } from '../Modal';
import './CreateEditTaskModal.css';

interface CreateEditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  initialTask?: TaskDTO | null;
  departmentMembers: UserDTO[];
}

export function CreateEditTaskModal({
  isOpen,
  onClose,
  onSubmit,
  initialTask,
  departmentMembers,
}: CreateEditTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('PENDING');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setPriority(initialTask.priority);
      setStatus(initialTask.status);
      setDueDate(initialTask.dueDate ? new Date(initialTask.dueDate).toISOString().slice(0, 16) : '');
      setAssigneeId(initialTask.assignee ? String(initialTask.assignee.id) : '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setStatus('PENDING');
      setDueDate('');
      setAssigneeId('');
    }
    setError(null);
  }, [initialTask, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề công việc');
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
            disabled={loading}
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
            disabled={loading}
          />
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="task-priority">Mức độ ưu tiên</label>
            <select
              id="task-priority"
              className="form-control"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              disabled={loading}
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
                disabled={loading}
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
              <option value="">-- Chưa phân công --</option>
              {departmentMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName} ({member.username}) - {member.role}
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

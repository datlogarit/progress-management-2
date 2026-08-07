import type { TaskDTO, TaskStatus } from '../../services/taskService';
import { 
  Calendar, 
  User as UserIcon, 
  MessageSquare, 
  MoreVertical, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Edit2,
  FolderKanban
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import './TaskCard.css';

interface TaskCardProps {
  task: TaskDTO;
  onViewDetail: (task: TaskDTO) => void;
  onEdit?: (task: TaskDTO) => void;
  onCancel?: (task: TaskDTO) => void;
  onStatusChange?: (taskId: number, status: TaskStatus) => void;
}

export function TaskCard({ task, onViewDetail, onEdit, onCancel, onStatusChange }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="task-status-badge completed">
            <CheckCircle2 size={12} /> Hoàn thành
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="task-status-badge in-progress">
            <Clock size={12} /> Đang làm
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="task-status-badge cancelled">
            <XCircle size={12} /> Đã hủy
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="task-status-badge pending">
            <AlertCircle size={12} /> Chưa làm
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="priority-badge urgent">Khẩn cấp</span>;
      case 'HIGH':
        return <span className="priority-badge high">Cao</span>;
      case 'LOW':
        return <span className="priority-badge low">Thấp</span>;
      case 'MEDIUM':
      default:
        return <span className="priority-badge medium">Trung bình</span>;
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';

  return (
    <div className={`task-card ${isOverdue ? 'overdue' : ''} ${showMenu ? 'has-open-menu' : ''}`}>
      <div className="task-card-header">
        <div className="status-priority-group">
          {getStatusBadge(task.status)}
          {getPriorityBadge(task.priority)}
        </div>

        <div className="card-actions-wrapper" ref={menuRef}>
          <button 
            className="card-menu-trigger"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && (
            <div className="card-menu-dropdown">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onViewDetail(task);
                }}
              >
                <MessageSquare size={14} /> Chi tiết & Bình luận
              </button>
              {onEdit && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit(task);
                  }}
                >
                  <Edit2 size={14} /> Chỉnh sửa
                </button>
              )}
              {onStatusChange && (
                <>
                  <div className="menu-divider" />
                  <div className="menu-label">Đổi trạng thái:</div>
                  {task.status !== 'IN_PROGRESS' && (
                    <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); onStatusChange(task.id, 'IN_PROGRESS'); }}>
                      Chuyển sang Đang làm
                    </button>
                  )}
                  {task.status !== 'COMPLETED' && (
                    <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); onStatusChange(task.id, 'COMPLETED'); }}>
                      Chuyển sang Hoàn thành
                    </button>
                  )}
                  {task.status !== 'PENDING' && (
                    <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); onStatusChange(task.id, 'PENDING'); }}>
                      Chuyển sang Chưa làm
                    </button>
                  )}
                </>
              )}
              {onCancel && task.status !== 'CANCELLED' && (
                <>
                  <div className="menu-divider" />
                  <button 
                    className="danger-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onCancel(task);
                    }}
                  >
                    <XCircle size={14} /> Hủy task
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {task.projectName && (
        <div className="task-project-tag">
          <FolderKanban size={12} className="icon" />
          <span>{task.projectName}</span>
        </div>
      )}

      <h3 className="task-card-title" onClick={() => onViewDetail(task)}>
        {task.title}
      </h3>

      {task.description && (
        <p className="task-card-desc">
          {task.description.length > 90 ? `${task.description.substring(0, 90)}...` : task.description}
        </p>
      )}

      <div className="task-card-footer">
        <div className="task-assignee">
          <UserIcon size={14} className="icon" />
          <span>{task.assignee ? task.assignee.fullName : 'Chưa giao'}</span>
        </div>

        {task.dueDate && (
          <div className={`task-duedate ${isOverdue ? 'overdue-text' : ''}`}>
            <Calendar size={14} className="icon" />
            <span>{new Date(task.dueDate).toLocaleDateString('vi-VN')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import type { TaskDTO, CommentDTO, TaskStatus } from '../../services/taskService';
import type { UserDTO } from '../../services/authService';
import { 
  getTaskCommentsApi, 
  addCommentApi, 
  updateTaskStatusApi 
} from '../../services/taskService';
import { Modal } from '../Modal';
import { 
  Calendar, 
  User as UserIcon, 
  Building2, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './TaskDetailModal.css';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskDTO | null;
  departmentMembers?: UserDTO[];
  onTaskUpdated?: (updatedTask: TaskDTO) => void;
  highlightedCommentId?: number;
}

export function TaskDetailModal({
  isOpen,
  onClose,
  task,
  onTaskUpdated,
  highlightedCommentId,
}: TaskDetailModalProps) {
  const { hasPermission } = useAuth();
  const isLeader = hasPermission('TASK_ASSIGN') && !hasPermission('SYSTEM_MANAGE');
  const [currentTask, setCurrentTask] = useState<TaskDTO | null>(task);
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentTask(task);
    if (task && isOpen) {
      loadComments(task.id);
    } else {
      setComments([]);
    }
  }, [task, isOpen]);

  const loadComments = async (taskId: number) => {
    setLoadingComments(true);
    try {
      const data = await getTaskCommentsApi(taskId);
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments', err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (highlightedCommentId && comments.length > 0) {
      setTimeout(() => {
        const commentEl = document.getElementById(`comment-${highlightedCommentId}`);
        if (commentEl) {
          commentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [highlightedCommentId, comments]);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!currentTask) return;
    setActionError(null);
    try {
      const updated = await updateTaskStatusApi(currentTask.id, newStatus);
      setCurrentTask(updated);
      if (onTaskUpdated) onTaskUpdated(updated);
    } catch (err: any) {
      setActionError(err.message || 'Không thể đổi trạng thái');
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTask || !newComment.trim()) return;

    setSendingComment(true);
    setActionError(null);
    try {
      const created = await addCommentApi(currentTask.id, newComment.trim());
      setComments((prev) => [...prev, created]);
      setNewComment('');
    } catch (err: any) {
      setActionError(err.message || 'Không thể gửi bình luận');
    } finally {
      setSendingComment(false);
    }
  };

  if (!currentTask) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết Công việc & Thảo luận">
      <div className="task-detail-container">
        {actionError && <div className="detail-error-alert">{actionError}</div>}

        {/* Task Core Info */}
        <div className="detail-header-card">
          <h2 className="detail-title">{currentTask.title}</h2>

          <div className="detail-meta-grid">
            <div className="meta-item">
              <span className="meta-label">Trạng thái:</span>
              {isLeader ? (
                <span className={`status-pill ${currentTask.status.toLowerCase()}`}>
                  {currentTask.status === 'COMPLETED'
                    ? 'Hoàn thành'
                    : currentTask.status === 'IN_PROGRESS'
                    ? 'Đang làm'
                    : currentTask.status === 'PENDING'
                    ? 'Chưa làm'
                    : 'Đã hủy'}
                </span>
              ) : (
                <div className="status-selector-group">
                  <button
                    className={`status-btn pending ${currentTask.status === 'PENDING' ? 'active' : ''}`}
                    onClick={() => handleStatusChange('PENDING')}
                  >
                    <AlertCircle size={12} /> Chưa làm
                  </button>
                  <button
                    className={`status-btn in-progress ${currentTask.status === 'IN_PROGRESS' ? 'active' : ''}`}
                    onClick={() => handleStatusChange('IN_PROGRESS')}
                  >
                    <Clock size={12} /> Đang làm
                  </button>
                  <button
                    className={`status-btn completed ${currentTask.status === 'COMPLETED' ? 'active' : ''}`}
                    onClick={() => handleStatusChange('COMPLETED')}
                  >
                    <CheckCircle2 size={12} /> Hoàn thành
                  </button>
                </div>
              )}
            </div>

            <div className="meta-item">
              <span className="meta-label">Người được giao:</span>
              <span className="meta-value">
                <UserIcon size={14} />{' '}
                {currentTask.assignee
                  ? `${currentTask.assignee.fullName} (@${currentTask.assignee.username})`
                  : 'Chưa giao'}
              </span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Người tạo task:</span>
              <span className="meta-value">
                <UserIcon size={14} /> {currentTask.createdBy.fullName}
              </span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Thuộc dự án:</span>
              <span className="meta-value">
                <Building2 size={14} /> {currentTask.projectName}
              </span>
            </div>

            {currentTask.dueDate && (
              <div className="meta-item">
                <span className="meta-label">Hạn hoàn thành:</span>
                <span className="meta-value">
                  <Calendar size={14} /> {new Date(currentTask.dueDate).toLocaleString('vi-VN')}
                </span>
              </div>
            )}
          </div>

          {currentTask.description && (
            <div className="detail-description">
              <div className="description-label">Mô tả công việc:</div>
              <p className="description-text">{currentTask.description}</p>
            </div>
          )}
        </div>

        {/* Discussion Section */}
        <div className="discussion-section">
          <h3 className="discussion-heading">
            <MessageSquare size={18} /> Trao đổi & Thảo luận ({comments.length})
          </h3>

          <div className="comments-timeline">
            {loadingComments ? (
              <p className="comments-loading">Đang tải bình luận...</p>
            ) : comments.length === 0 ? (
              <p className="comments-empty">Chưa có bình luận nào. Hãy gửi bình luận đầu tiên!</p>
            ) : (
              comments.map((comment) => (
                <div 
                  key={comment.id} 
                  id={`comment-${comment.id}`}
                  className={`comment-bubble ${highlightedCommentId === comment.id ? 'highlighted-comment' : ''}`}
                >
                  <div className="comment-header">
                    <span className="comment-author">{comment.user.fullName}</span>
                    <span className="comment-time">
                      {new Date(comment.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="comment-body">{comment.content}</div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendComment} className="comment-input-form">
            <input
              type="text"
              className="comment-input"
              placeholder="Nhập nội dung trao đổi..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={sendingComment}
            />
            <button
              type="submit"
              className="send-comment-btn"
              disabled={sendingComment || !newComment.trim()}
            >
              <Send size={16} /> Gửi
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
}

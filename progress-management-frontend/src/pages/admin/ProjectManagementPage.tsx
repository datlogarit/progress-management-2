import React, { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Modal } from '../../components/Modal';
import { 
  getProjectsApi, 
  createProjectApi, 
  updateProjectApi, 
  deleteProjectApi 
} from '../../services/projectService';
import type { ProjectDTO } from '../../services/projectService';
import { getAllDepartmentsApi } from '../../services/departmentService';
import type { DepartmentDTO } from '../../services/departmentService';
import { getAllUsersApi } from '../../services/userService';
import type { UserDTO } from '../../services/authService';
import { FolderKanban, Plus, Edit3, Trash2, Users, Calendar, Building2 } from 'lucide-react';
import './ProjectManagementPage.css';

export function ProjectManagementPage() {
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [users, setUsers] = useState<UserDTO[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectDTO | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    description: '',
    departmentId: 0,
    status: 'ACTIVE',
    memberIds: [] as number[],
    managerIds: [] as number[],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projData, deptData, userData] = await Promise.all([
        getProjectsApi(),
        getAllDepartmentsApi(),
        getAllUsersApi()
      ]);
      setProjects(projData);
      setDepartments(deptData);
      setUsers(userData);
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.departmentId) {
      setError('Vui lòng chọn phòng ban cho dự án');
      return;
    }
    try {
      setError(null);
      await createProjectApi({
        name: form.name,
        description: form.description,
        departmentId: form.departmentId,
        memberIds: form.memberIds,
        managerIds: form.managerIds,
      });
      setIsCreateModalOpen(false);
      showSuccess('Tạo dự án mới thành công!');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Lỗi tạo dự án');
    }
  };

  const handleOpenEditModal = (p: ProjectDTO) => {
    setSelectedProject(p);
    const leaders = p.members ? p.members.filter(m => m.projectRole === 'LEADER').map(m => m.id) : [];
    const employees = p.members ? p.members.filter(m => m.projectRole === 'EMPLOYEE').map(m => m.id) : [];
    setForm({
      name: p.name,
      description: p.description || '',
      departmentId: p.departmentId,
      status: p.status,
      memberIds: employees,
      managerIds: leaders,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      setError(null);
      await updateProjectApi(selectedProject.id, {
        name: form.name,
        description: form.description,
        status: form.status,
        memberIds: form.memberIds,
        managerIds: form.managerIds,
      });
      setIsEditModalOpen(false);
      showSuccess(`Cập nhật dự án ${selectedProject.name} thành công!`);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Lỗi cập nhật dự án');
    }
  };

  const handleDelete = async (p: ProjectDTO) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa dự án "${p.name}"?`)) return;
    try {
      setError(null);
      await deleteProjectApi(p.id);
      showSuccess(`Đã xóa dự án ${p.name}!`);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Lỗi xóa dự án');
    }
  };

  const handleMemberToggle = (userId: number) => {
    setForm(prev => {
      const isSelected = prev.memberIds.includes(userId);
      if (isSelected) {
        return { ...prev, memberIds: prev.memberIds.filter(id => id !== userId) };
      } else {
        return { ...prev, memberIds: [...prev.memberIds, userId] };
      }
    });
  };

  const handleManagerToggle = (userId: number) => {
    setForm(prev => {
      const isSelected = prev.managerIds.includes(userId);
      if (isSelected) {
        return { ...prev, managerIds: prev.managerIds.filter(id => id !== userId) };
      } else {
        return { ...prev, managerIds: [...prev.managerIds, userId] };
      }
    });
  };

  const openCreateModal = () => {
    setForm({ name: '', description: '', departmentId: 0, status: 'ACTIVE', memberIds: [], managerIds: [] });
    setIsCreateModalOpen(true);
  };

  // Filter users by selected department for the form
  const availableUsersForDept = users.filter(u => u.departmentId === form.departmentId);
  const availableLeadersForDept = availableUsersForDept;

  return (
    <AdminLayout title="Quản lý Dự án">
      <div className="page-container">
        {successMsg && <div className="alert-banner success">{successMsg}</div>}
        {error && <div className="alert-banner danger">{error}</div>}

        <div className="toolbar-panel">
          <div className="proj-summary-count">
            <FolderKanban size={20} className="text-accent" />
            <span>Danh sách Dự án ({projects.length})</span>
          </div>

          <button className="btn-primary" onClick={openCreateModal}>
            <Plus size={18} />
            <span>Thêm dự án mới</span>
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Đang tải danh sách dự án...</div>
        ) : (
          <div className="proj-grid">
            {projects.map((p) => (
              <div key={p.id} className="proj-card">
                <div className="proj-card-header">
                  <div className="proj-icon">
                    <FolderKanban size={22} />
                  </div>
                  <div className="proj-card-actions">
                    <button className="btn-icon edit" onClick={() => handleOpenEditModal(p)} title="Sửa">
                      <Edit3 size={16} />
                    </button>
                    <button className="btn-icon delete" onClick={() => handleDelete(p)} title="Xóa">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="proj-card-body">
                  <h3 className="proj-title">{p.name}</h3>
                  <div className="proj-meta">
                    <span className="meta-dept"><Building2 size={12} /> {p.departmentName}</span>
                    <span className={`meta-status ${p.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="proj-desc">
                    {p.description || 'Chưa có mô tả chi tiết cho dự án này.'}
                  </p>
                </div>

                <div className="proj-card-footer">
                  <div className="proj-stat">
                    <Users size={14} />
                    <span>
                      {(p.members ? p.members.filter(m => m.projectRole === 'LEADER').length : 0)} Trưởng dự án | {(p.members ? p.members.filter(m => m.projectRole === 'EMPLOYEE').length : 0)} Nhân viên
                    </span>
                  </div>
                  <div className="proj-stat">
                    <Calendar size={14} />
                    <span>{new Date(p.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
            ))}

            {projects.length === 0 && (
              <div className="empty-proj-card">
                <FolderKanban size={40} className="empty-icon" />
                <p>Chưa có dự án nào. Hãy tạo dự án đầu tiên!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Tạo dự án mới">
        <form onSubmit={handleCreateSubmit} className="modal-form proj-form">
          <div className="form-group">
            <label>Tên dự án *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Phòng ban quản lý *</label>
            <select required value={form.departmentId} onChange={(e) => setForm({...form, departmentId: Number(e.target.value), memberIds: [], managerIds: []})}>
              <option value={0} disabled>-- Chọn phòng ban --</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Mô tả dự án</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
          </div>
          
          {form.departmentId > 0 && (
            <>
              <div className="form-group">
                <label>Trưởng dự án (Leader quản lý)</label>
                <div className="members-select-list">
                  {availableLeadersForDept.length === 0 ? <p className="no-members-text">Phòng ban này chưa có Leader nào.</p> : null}
                  {availableLeadersForDept.map(u => (
                    <label key={u.id} className="member-checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={form.managerIds.includes(u.id)}
                        onChange={() => handleManagerToggle(u.id)}
                      />
                      {u.fullName} ({u.username})
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Thành viên thực hiện</label>
                <div className="members-select-list">
                  {availableUsersForDept.length === 0 ? <p className="no-members-text">Phòng ban này chưa có nhân sự nào.</p> : null}
                  {availableUsersForDept.map(u => (
                    <label key={u.id} className="member-checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={form.memberIds.includes(u.id)}
                        onChange={() => handleMemberToggle(u.id)}
                      />
                      {u.fullName} ({u.username})
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Hủy</button>
            <button type="submit" className="btn-primary">Tạo dự án</button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Sửa dự án: ${selectedProject?.name}`}>
        <form onSubmit={handleUpdateSubmit} className="modal-form proj-form">
          <div className="form-group">
            <label>Tên dự án *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Trạng thái</label>
            <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
              <option value="ACTIVE">Hoạt động</option>
              <option value="COMPLETED">Đã hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
          <div className="form-group">
            <label>Mô tả dự án</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
          </div>

          <div className="form-group">
            <label>Trưởng dự án (Leader quản lý)</label>
            <div className="members-select-list">
              {availableLeadersForDept.length === 0 ? <p className="no-members-text">Phòng ban này chưa có nhân sự nào.</p> : null}
              {availableLeadersForDept.map(u => (
                <label key={u.id} className="member-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={form.managerIds.includes(u.id)}
                    onChange={() => handleManagerToggle(u.id)}
                  />
                  {u.fullName} ({u.username})
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Thành viên thực hiện (thuộc phòng ban {selectedProject?.departmentName})</label>
            <div className="members-select-list">
              {availableUsersForDept.length === 0 ? <p className="no-members-text">Phòng ban này chưa có nhân sự nào.</p> : null}
              {availableUsersForDept.map(u => (
                <label key={u.id} className="member-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={form.memberIds.includes(u.id)}
                    onChange={() => handleMemberToggle(u.id)}
                  />
                  {u.fullName} ({u.username})
                </label>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>Hủy</button>
            <button type="submit" className="btn-primary">Cập nhật</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}

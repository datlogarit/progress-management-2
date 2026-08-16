import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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
import { FolderKanban, Plus, Edit3, Trash2, Users, Calendar, Building2, Search, ChevronDown, Check } from 'lucide-react';
import './ProjectManagementPage.css';

interface MemberSelectDropbarProps {
  label: string;
  placeholder?: string;
  options: UserDTO[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  noOptionsText: string;
}

function MemberSelectDropbar({
  label,
  placeholder = '-- Chọn thành viên --',
  options,
  selectedIds,
  onToggle,
  noOptionsText,
}: MemberSelectDropbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedUsers = options.filter((u) => selectedIds.includes(u.id));

  return (
    <div className="form-group dropbar-group" ref={dropdownRef}>
      <label>{label}</label>
      <div 
        className={`dropbar-header ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="dropbar-selected-tags">
          {selectedUsers.length === 0 ? (
            <span className="dropbar-placeholder">{placeholder}</span>
          ) : (
            selectedUsers.map((u) => (
              <span key={u.id} className="dropbar-tag">
                {u.fullName}
                <span
                  className="dropbar-tag-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(u.id);
                  }}
                >
                  ×
                </span>
              </span>
            ))
          )}
        </div>
        <div className="dropbar-arrow">
          <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </div>
      </div>

      {isOpen && (
        <div className="dropbar-menu">
          {options.length === 0 ? (
            <div className="dropbar-no-options">{noOptionsText}</div>
          ) : (
            options.map((u) => {
              const isSelected = selectedIds.includes(u.id);
              return (
                <div
                  key={u.id}
                  className={`dropbar-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => onToggle(u.id)}
                >
                  <div className="dropbar-checkbox">
                    {isSelected && <Check size={14} />}
                  </div>
                  <span className="dropbar-item-text">{u.fullName} (@{u.username})</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function ProjectManagementPage() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [users, setUsers] = useState<UserDTO[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);

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
      const [projData, deptData, userData] = await Promise.all([
        getProjectsApi(),
        getAllDepartmentsApi(),
        getAllUsersApi()
      ]);
      setProjects(projData);
      setDepartments(deptData);
      setUsers(userData);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.departmentId) {
      toast.error('Vui lòng chọn phòng ban cho dự án');
      return;
    }
    try {
      await createProjectApi({
        name: form.name,
        description: form.description,
        departmentId: form.departmentId,
        memberIds: form.memberIds,
        managerIds: form.managerIds,
      });
      setIsCreateModalOpen(false);
      toast.success('Tạo dự án mới thành công!');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tạo dự án');
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
      await updateProjectApi(selectedProject.id, {
        name: form.name,
        description: form.description,
        status: form.status,
        memberIds: form.memberIds,
        managerIds: form.managerIds,
      });
      setIsEditModalOpen(false);
      toast.success(`Cập nhật dự án ${selectedProject.name} thành công!`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi cập nhật dự án');
    }
  };

  const handleDelete = async (p: ProjectDTO) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa dự án "${p.name}"?`)) return;
    try {
      await deleteProjectApi(p.id);
      toast.success(`Đã xóa dự án ${p.name}!`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi xóa dự án');
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

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.departmentName && p.departmentName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AdminLayout title="Quản lý Dự án">
      <div className="page-container">
        <div className="toolbar-panel">
          <div className="proj-summary-count" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderKanban size={20} className="text-accent" />
              <span>Danh sách Dự án ({filteredProjects.length})</span>
            </div>

            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm dự án..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
            {filteredProjects.map((p) => (
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
                  <div 
                    className="proj-stat" 
                    style={{ cursor: 'pointer', color: 'var(--color-accent, #4f46e5)' }}
                    onClick={() => navigate(`/admin/users?projectId=${p.id}`)}
                    title="Bấm để xem quản lý tài khoản các user trong dự án này"
                  >
                    <Users size={14} />
                    <span>
                      {(p.members ? p.members.filter(m => m.projectRole === 'LEADER').length : 0)} Trưởng | {(p.members ? p.members.filter(m => m.projectRole === 'EMPLOYEE').length : 0)} Nhân viên
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
              <MemberSelectDropbar
                label="Trưởng dự án (Leader quản lý)"
                placeholder="-- Chọn Trưởng dự án --"
                options={availableLeadersForDept}
                selectedIds={form.managerIds}
                onToggle={handleManagerToggle}
                noOptionsText="Phòng ban này chưa có Leader nào."
              />

              <MemberSelectDropbar
                label="Thành viên thực hiện"
                placeholder="-- Chọn Thành viên thực hiện --"
                options={availableUsersForDept}
                selectedIds={form.memberIds}
                onToggle={handleMemberToggle}
                noOptionsText="Phòng ban này chưa có nhân sự nào."
              />
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

          <MemberSelectDropbar
            label="Trưởng dự án (Leader quản lý)"
            placeholder="-- Chọn Trưởng dự án --"
            options={availableLeadersForDept}
            selectedIds={form.managerIds}
            onToggle={handleManagerToggle}
            noOptionsText="Phòng ban này chưa có nhân sự nào."
          />

          <MemberSelectDropbar
            label={`Thành viên thực hiện (thuộc phòng ban ${selectedProject?.departmentName || ''})`}
            placeholder="-- Chọn Thành viên thực hiện --"
            options={availableUsersForDept}
            selectedIds={form.memberIds}
            onToggle={handleMemberToggle}
            noOptionsText="Phòng ban này chưa có nhân sự nào."
          />

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>Hủy</button>
            <button type="submit" className="btn-primary">Cập nhật</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}

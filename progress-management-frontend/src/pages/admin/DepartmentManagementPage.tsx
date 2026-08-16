import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AdminLayout } from './AdminLayout';
import { Modal } from '../../components/Modal';
import { 
  getAllDepartmentsApi, 
  createDepartmentApi, 
  updateDepartmentApi, 
  deleteDepartmentApi 
} from '../../services/departmentService';
import type { DepartmentDTO } from '../../services/departmentService';
import { getAllTeamsApi, type TeamDTO } from '../../services/teamService.ts';
import { getProjectsApi, type ProjectDTO } from '../../services/projectService.ts';
import { Building2, Plus, Edit3, Trash2, Users, Calendar, UserCheck, Search, FolderKanban, ExternalLink } from 'lucide-react';
import './DepartmentManagementPage.css';

export function DepartmentManagementPage() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<DepartmentDTO | null>(null);
  const [selectedDetailDept, setSelectedDetailDept] = useState<DepartmentDTO | null>(null);

  // Form State
  const [deptForm, setDeptForm] = useState<{
    name: string;
    description: string;
    teamId: number | '';
  }>({
    name: '',
    description: '',
    teamId: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptData, teamData, projData] = await Promise.all([
        getAllDepartmentsApi(),
        getAllTeamsApi(),
        getProjectsApi(),
      ]);
      setDepartments(deptData);
      setTeams(teamData);
      setProjects(projData);
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
      else toast.error('Không thể tải dữ liệu phòng ban');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDepartmentApi({
        name: deptForm.name,
        description: deptForm.description,
        teamId: deptForm.teamId === '' ? null : Number(deptForm.teamId),
      });
      setIsCreateModalOpen(false);
      setDeptForm({ name: '', description: '', teamId: '' });
      toast.success('Tạo phòng ban mới thành công!');
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  const handleOpenEditModal = (d: DepartmentDTO) => {
    setSelectedDept(d);
    setDeptForm({
      name: d.name,
      description: d.description || '',
      teamId: d.teamId ?? '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;
    try {
      await updateDepartmentApi(selectedDept.id, {
        name: deptForm.name,
        description: deptForm.description,
        teamId: deptForm.teamId === '' ? null : Number(deptForm.teamId),
      });
      setIsEditModalOpen(false);
      toast.success(`Cập nhật phòng ban ${selectedDept.name} thành công!`);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  const handleDeleteDept = async (d: DepartmentDTO) => {
    const confirmMessage = d.userCount > 0
      ? `Phòng ban "${d.name}" hiện đang có ${d.userCount} nhân sự. Nếu xóa, các nhân sự này sẽ được chuyển thành "Chưa gán phòng ban". Bạn có chắc chắn muốn xóa?`
      : `Bạn có chắc chắn muốn xóa phòng ban "${d.name}"?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await deleteDepartmentApi(d.id);
      toast.success(`Đã xóa phòng ban ${d.name}!`);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.teamName && d.teamName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AdminLayout title="Quản lý Phòng ban">
      <div className="page-container">

        {/* Toolbar Header */}
        <div className="toolbar-panel">
          <div className="dept-summary-count" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={20} className="text-accent" />
              <span>Danh sách các Phòng Ban ({filteredDepartments.length})</span>
            </div>

            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm phòng ban..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <button className="btn-primary" onClick={() => {
            setDeptForm({ name: '', description: '', teamId: '' });
            setIsCreateModalOpen(true);
          }}>
            <Plus size={18} />
            <span>Thêm phòng ban mới</span>
          </button>
        </div>

        {/* Department Grid Cards */}
        {loading ? (
          <div className="loading-state">Đang tải danh sách phòng ban...</div>
        ) : (
          <div className="dept-grid">
            {filteredDepartments.map((d) => {
              const deptProjects = projects.filter((p) => p.departmentId === d.id);
              return (
                <div key={d.id} className="dept-card">
                  <div className="dept-card-header">
                    <div className="dept-icon">
                      <Building2 size={22} />
                    </div>
                    <div className="dept-card-actions">
                      <button
                        className="btn-icon edit"
                        onClick={() => handleOpenEditModal(d)}
                        title="Chỉnh sửa phòng ban"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={() => handleDeleteDept(d)}
                        title="Xóa phòng ban"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="dept-card-body">
                    <div className="dept-header-title">
                      <h3 className="dept-title">{d.name}</h3>
                      <span className={`dept-team-badge ${d.teamName ? 'active' : 'none'}`}>
                        <UserCheck size={12} />
                        {d.teamName ? `Thuộc: ${d.teamName}` : 'Chưa phân Đội nhóm'}
                      </span>
                    </div>
                    <p className="dept-desc">
                      {d.description || 'Chưa có mô tả chi tiết cho phòng ban này.'}
                    </p>

                    <div style={{ marginTop: '12px' }}>
                      <button
                        className="btn-projects-link"
                        onClick={() => {
                          setSelectedDetailDept(d);
                          setIsProjectModalOpen(true);
                        }}
                      >
                        <FolderKanban size={14} />
                        <span>Xem {deptProjects.length} dự án trong phòng ban</span>
                      </button>
                    </div>
                  </div>

                  <div className="dept-card-footer">
                    <div className="dept-stat">
                      <Users size={14} />
                      <span>{d.userCount} nhân sự</span>
                    </div>
                    <div className="dept-stat">
                      <Calendar size={14} />
                      <span>{new Date(d.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {departments.length === 0 && (
              <div className="empty-dept-card">
                <Building2 size={40} className="empty-icon" />
                <p>Chưa có phòng ban nào. Hãy tạo phòng ban đầu tiên cho hệ thống!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE DEPARTMENT MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tạo phòng ban mới"
      >
        <form onSubmit={handleCreateDept} className="modal-form">
          <div className="form-group">
            <label>Tên phòng ban *</label>
            <input
              type="text"
              required
              placeholder="VD: Dev 1, Dev 2, Helpdesk..."
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Thuộc Đội nhóm (Team)</label>
            <select
              value={deptForm.teamId}
              onChange={(e) => setDeptForm({ ...deptForm, teamId: e.target.value ? Number(e.target.value) : '' })}
            >
              <option value="">-- Chưa gán Đội nhóm --</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Mô tả chức năng phòng ban</label>
            <textarea
              rows={3}
              placeholder="Mô tả ngắn gọn chức năng, nhiệm vụ của phòng ban..."
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Hủy bỏ
            </button>
            <button type="submit" className="btn-primary">
              Tạo phòng ban
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT DEPARTMENT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Chỉnh sửa phòng ban: ${selectedDept?.name}`}
      >
        <form onSubmit={handleUpdateDept} className="modal-form">
          <div className="form-group">
            <label>Tên phòng ban *</label>
            <input
              type="text"
              required
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Thuộc Đội nhóm (Team)</label>
            <select
              value={deptForm.teamId}
              onChange={(e) => setDeptForm({ ...deptForm, teamId: e.target.value ? Number(e.target.value) : '' })}
            >
              <option value="">-- Chưa gán Đội nhóm --</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Mô tả phòng ban</label>
            <textarea
              rows={3}
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Hủy bỏ
            </button>
            <button type="submit" className="btn-primary">
              Cập nhật
            </button>
          </div>
        </form>
      </Modal>
      {/* PROJECTS IN DEPARTMENT MODAL */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title={`Các dự án thuộc phòng ban: ${selectedDetailDept?.name}`}
      >
        <div className="projects-list">
          {projects
            .filter((p) => p.departmentId === selectedDetailDept?.id)
            .map((p) => (
              <div
                key={p.id}
                className="project-item clickable"
                onClick={() => navigate(`/admin/projects?search=${encodeURIComponent(p.name)}`)}
                title={`Bấm để tới trang Quản lý dự án ${p.name}`}
              >
                <div className="project-icon">
                  <FolderKanban size={20} />
                </div>
                <div className="project-info">
                  <div className="project-name">{p.name}</div>
                  <div className="project-desc">{p.description || 'Chưa có mô tả'}</div>
                </div>
                <button
                  className="project-members-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/users?projectId=${p.id}`);
                  }}
                  title="Bấm để tới trang Quản lý thành viên trong dự án này"
                >
                  <Users size={13} />
                  <span>{p.members ? p.members.length : 0} thành viên</span>
                </button>
                <div className="project-link-icon">
                  <ExternalLink size={16} />
                </div>
              </div>
            ))}
          {projects.filter((p) => p.departmentId === selectedDetailDept?.id).length === 0 && (
            <div className="empty-state-text" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
              Chưa có dự án nào thuộc phòng ban này.
            </div>
          )}
        </div>
      </Modal>
    </AdminLayout>
  );
}

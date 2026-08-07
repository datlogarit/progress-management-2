import React, { useEffect, useState } from 'react';
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
import { Building2, Plus, Edit3, Trash2, Users, Calendar, UserCheck } from 'lucide-react';
import './DepartmentManagementPage.css';

export function DepartmentManagementPage() {
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<DepartmentDTO | null>(null);

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
      setError(null);
      const [deptData, teamData] = await Promise.all([
        getAllDepartmentsApi(),
        getAllTeamsApi(),
      ]);
      setDepartments(deptData);
      setTeams(teamData);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Không thể tải dữ liệu phòng ban');
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

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await createDepartmentApi({
        name: deptForm.name,
        description: deptForm.description,
        teamId: deptForm.teamId === '' ? null : Number(deptForm.teamId),
      });
      setIsCreateModalOpen(false);
      setDeptForm({ name: '', description: '', teamId: '' });
      showSuccess('Tạo phòng ban mới thành công!');
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
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
      setError(null);
      await updateDepartmentApi(selectedDept.id, {
        name: deptForm.name,
        description: deptForm.description,
        teamId: deptForm.teamId === '' ? null : Number(deptForm.teamId),
      });
      setIsEditModalOpen(false);
      showSuccess(`Cập nhật phòng ban ${selectedDept.name} thành công!`);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  };

  const handleDeleteDept = async (d: DepartmentDTO) => {
    const confirmMessage = d.userCount > 0
      ? `Phòng ban "${d.name}" hiện đang có ${d.userCount} nhân sự. Nếu xóa, các nhân sự này sẽ được chuyển thành "Chưa gán phòng ban". Bạn có chắc chắn muốn xóa?`
      : `Bạn có chắc chắn muốn xóa phòng ban "${d.name}"?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setError(null);
      await deleteDepartmentApi(d.id);
      showSuccess(`Đã xóa phòng ban ${d.name}!`);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  };

  return (
    <AdminLayout title="Quản lý Phòng ban">
      <div className="page-container">
        {/* Banner Alert Messages */}
        {successMsg && <div className="alert-banner success">{successMsg}</div>}
        {error && <div className="alert-banner danger">{error}</div>}

        {/* Toolbar Header */}
        <div className="toolbar-panel">
          <div className="dept-summary-count">
            <Building2 size={20} className="text-accent" />
            <span>Danh sách các Phòng Ban trong Tổ chức ({departments.length})</span>
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
            {departments.map((d) => (
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
            ))}

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
    </AdminLayout>
  );
}

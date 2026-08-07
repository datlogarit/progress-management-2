import React, { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Modal } from '../../components/Modal';
import { 
  getAllTeamsApi, 
  createTeamApi, 
  updateTeamApi, 
  deleteTeamApi,
  type TeamDTO
} from '../../services/teamService.ts';
import { UserCheck, Plus, Edit3, Trash2, Calendar, Search } from 'lucide-react';
import './TeamManagementPage.css';

export function TeamManagementPage() {
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamDTO | null>(null);

  // Form State
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
  });

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllTeamsApi();
      setTeams(data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Không thể tải danh sách đội nhóm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await createTeamApi(teamForm);
      setIsCreateModalOpen(false);
      setTeamForm({ name: '', description: '' });
      showSuccess('Tạo đội nhóm mới thành công!');
      fetchTeams();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  };

  const handleOpenEditModal = (t: TeamDTO) => {
    setSelectedTeam(t);
    setTeamForm({
      name: t.name,
      description: t.description || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    try {
      setError(null);
      await updateTeamApi(selectedTeam.id, teamForm);
      setIsEditModalOpen(false);
      showSuccess(`Cập nhật đội nhóm "${selectedTeam.name}" thành công!`);
      fetchTeams();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  };

  const handleDeleteTeam = async (t: TeamDTO) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đội nhóm "${t.name}"?`)) return;

    try {
      setError(null);
      await deleteTeamApi(t.id);
      showSuccess(`Đã xóa đội nhóm "${t.name}"!`);
      fetchTeams();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  };

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AdminLayout title="Quản lý Đội nhóm (Teams)">
      <div className="page-container">
        {/* Banner Alert Messages */}
        {successMsg && <div className="alert-banner success">{successMsg}</div>}
        {error && <div className="alert-banner danger">{error}</div>}

        {/* Toolbar Header */}
        <div className="toolbar-panel">
          <div className="team-summary-info">
            <div className="summary-title">
              <UserCheck size={22} className="text-accent" />
              <span>Đội Nhóm Tổ Chức ({teams.length})</span>
            </div>
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm đội nhóm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <button className="btn-primary" onClick={() => {
            setTeamForm({ name: '', description: '' });
            setIsCreateModalOpen(true);
          }}>
            <Plus size={18} />
            <span>Thêm đội nhóm mới</span>
          </button>
        </div>

        {/* Team Grid Cards */}
        {loading ? (
          <div className="loading-state">Đang tải danh sách đội nhóm...</div>
        ) : (
          <div className="team-grid">
            {filteredTeams.map((t) => (
              <div key={t.id} className="team-card">
                <div className="team-card-header">
                  <div className="team-icon-badge">
                    <UserCheck size={22} />
                  </div>
                  <div className="team-card-actions">
                    <button
                      className="btn-icon edit"
                      onClick={() => handleOpenEditModal(t)}
                      title="Chỉnh sửa đội nhóm"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      className="btn-icon delete"
                      onClick={() => handleDeleteTeam(t)}
                      title="Xóa đội nhóm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="team-card-body">
                  <div className="team-header-title">
                    <h3 className="team-title">{t.name}</h3>
                    <span className="team-tag">Team</span>
                  </div>
                  <p className="team-desc">
                    {t.description || 'Chưa có mô tả chi tiết cho đội nhóm này.'}
                  </p>
                </div>

                <div className="team-card-footer">
                  <div className="team-stat">
                    <Calendar size={14} />
                    <span>Tạo ngày: {new Date(t.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
            ))}

            {filteredTeams.length === 0 && (
              <div className="empty-team-card">
                <UserCheck size={44} className="empty-icon" />
                <p>Không tìm thấy đội nhóm nào. Hãy khởi tạo đội nhóm mới cho hệ thống!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE TEAM MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tạo đội nhóm mới"
      >
        <form onSubmit={handleCreateTeam} className="modal-form">
          <div className="form-group">
            <label>Tên đội nhóm *</label>
            <input
              type="text"
              required
              placeholder="VD: Đội IT, Đội Hành chính Nhân sự..."
              value={teamForm.name}
              onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Mô tả đội nhóm</label>
            <textarea
              rows={3}
              placeholder="Mô tả nhiệm vụ, phạm vi làm việc của đội nhóm..."
              value={teamForm.description}
              onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
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
              Tạo đội nhóm
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT TEAM MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Chỉnh sửa đội nhóm: ${selectedTeam?.name}`}
      >
        <form onSubmit={handleUpdateTeam} className="modal-form">
          <div className="form-group">
            <label>Tên đội nhóm *</label>
            <input
              type="text"
              required
              value={teamForm.name}
              onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Mô tả đội nhóm</label>
            <textarea
              rows={3}
              value={teamForm.description}
              onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
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

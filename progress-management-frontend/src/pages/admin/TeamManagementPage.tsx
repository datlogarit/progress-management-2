import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AdminLayout } from './AdminLayout';
import { Modal } from '../../components/Modal';
import { 
  getAllTeamsApi, 
  createTeamApi, 
  updateTeamApi, 
  deleteTeamApi,
  type TeamDTO
} from '../../services/teamService.ts';
import { getAllDepartmentsApi, type DepartmentDTO } from '../../services/departmentService.ts';
import { UserCheck, Plus, Edit3, Trash2, Calendar, Search, Building2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './TeamManagementPage.css';

export function TeamManagementPage() {
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const navigate = useNavigate();

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamDTO | null>(null);
  const [selectedDetailTeam, setSelectedDetailTeam] = useState<TeamDTO | null>(null);

  // Form State
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
  });

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const [teamsData, deptsData] = await Promise.all([
        getAllTeamsApi(),
        getAllDepartmentsApi(),
      ]);
      setTeams(teamsData);
      setDepartments(deptsData);
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
      else toast.error('Không thể tải danh sách đội nhóm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTeamApi(teamForm);
      setIsCreateModalOpen(false);
      setTeamForm({ name: '', description: '' });
      toast.success('Tạo đội nhóm mới thành công!');
      fetchTeams();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
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
      await updateTeamApi(selectedTeam.id, teamForm);
      setIsEditModalOpen(false);
      toast.success(`Cập nhật đội nhóm "${selectedTeam.name}" thành công!`);
      fetchTeams();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  const handleDeleteTeam = async (t: TeamDTO) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đội nhóm "${t.name}"?`)) return;

    try {
      await deleteTeamApi(t.id);
      toast.success(`Đã xóa đội nhóm "${t.name}"!`);
      fetchTeams();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AdminLayout title="Quản lý Đội nhóm (Teams)">
      <div className="page-container">

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
            {filteredTeams.map((t) => {
              const subDepts = departments.filter((d) => d.teamId === t.id);
              return (
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

                    <div style={{ marginTop: '12px' }}>
                      <button
                        className="btn-subteams-link"
                        onClick={() => {
                          setSelectedDetailTeam(t);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <Building2 size={14} />
                        <span>Xem {subDepts.length} phòng ban/team trong đội</span>
                      </button>
                    </div>
                  </div>

                  <div className="team-card-footer">
                    <div className="team-stat">
                      <Calendar size={14} />
                      <span>Tạo ngày: {new Date(t.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
              );
            })}

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
      {/* DETAIL TEAM MODAL */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Các phòng ban / team trong đội: ${selectedDetailTeam?.name}`}
      >
        <div className="subteams-list">
          {departments
            .filter((d) => d.teamId === selectedDetailTeam?.id)
            .map((d) => (
              <div
                key={d.id}
                className="subteam-item clickable"
                onClick={() => navigate(`/admin/departments?search=${encodeURIComponent(d.name)}`)}
                title={`Bấm để tới trang Quản lý phòng ban ${d.name}`}
              >
                <div className="subteam-icon">
                  <Building2 size={20} />
                </div>
                <div className="subteam-info">
                  <div className="subteam-name">{d.name}</div>
                  <div className="subteam-desc">{d.description || 'Chưa có mô tả'}</div>
                </div>
                <div className="subteam-badge">{d.userCount} nhân sự</div>
                <div className="subteam-link-icon">
                  <ExternalLink size={16} />
                </div>
              </div>
            ))}
          {departments.filter((d) => d.teamId === selectedDetailTeam?.id).length === 0 && (
            <div className="empty-state-text" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
              Chưa có phòng ban / team con nào thuộc đội nhóm này.
            </div>
          )}
        </div>
      </Modal>
    </AdminLayout>
  );
}

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AdminLayout } from './AdminLayout';
import { Modal } from '../../components/Modal';
import { 
  getAllUsersApi, 
  createUserApi, 
  updateUserApi, 
  resetPasswordApi, 
  assignRoleApi, 
  assignDepartmentApi, 
  deleteUserApi 
} from '../../services/userService';
import { getAllDepartmentsApi } from '../../services/departmentService';
import type { DepartmentDTO } from '../../services/departmentService';
import type { UserDTO } from '../../services/authService';
import { getProjectsApi, type ProjectDTO } from '../../services/projectService';
import { getAllTeamsApi, type TeamDTO } from '../../services/teamService';
import { 
  UserPlus, 
  Search, 
  Key, 
  Building2, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  XCircle, 
  FolderKanban,
  Users
} from 'lucide-react';
import './UserManagementPage.css';

export function UserManagementPage() {
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get('projectId') || 'ALL';

  const [users, setUsers] = useState<UserDTO[]>([]);
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter State
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [filterTeamId, setFilterTeamId] = useState<string>('ALL');
  const [filterDepartmentId, setFilterDepartmentId] = useState<string>('ALL');
  const [filterProjectId, setFilterProjectId] = useState<string>(initialProjectId);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignActionType, setReassignActionType] = useState<'PROMOTE' | 'INACTIVATE' | 'DELETE'>('PROMOTE');
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);
  const [targetUserForReassign, setTargetUserForReassign] = useState<UserDTO | null>(null);
  const [pendingUpdateForm, setPendingUpdateForm] = useState<{ email: string; fullName: string; isActive: boolean } | null>(null);
  const [replacementCandidates, setReplacementCandidates] = useState<UserDTO[]>([]);
  const [selectedReplacementId, setSelectedReplacementId] = useState<number | null>(null);

  // Form inputs
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'EMPLOYEE' as 'ADMIN' | 'LEADER' | 'EMPLOYEE',
    departmentId: '' as string,
  });

  const [editForm, setEditForm] = useState({
    email: '',
    fullName: '',
    isActive: true,
  });

  const [resetPwdInput, setResetPwdInput] = useState('');

  // Load Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, deptsData, projsData, teamsData] = await Promise.all([
        getAllUsersApi(),
        getAllDepartmentsApi(),
        getProjectsApi(),
        getAllTeamsApi(),
      ]);
      setUsers(usersData);
      setDepartments(deptsData);
      setProjects(projsData);
      setTeams(teamsData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Không thể tải danh sách tài khoản');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesKeyword = 
      u.fullName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      u.username.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      u.email.toLowerCase().includes(searchKeyword.toLowerCase());

    const userDept = departments.find((d) => d.id === u.departmentId);

    const matchesDept = 
      filterDepartmentId === 'ALL' || 
      (filterDepartmentId === 'NONE' && u.departmentId === null) ||
      u.departmentId?.toString() === filterDepartmentId;

    const matchesTeam = 
      filterTeamId === 'ALL' ||
      (filterTeamId === 'NONE' && (!userDept || !userDept.teamId)) ||
      userDept?.teamId?.toString() === filterTeamId;

    const matchesProject = () => {
      if (filterProjectId === 'ALL') return true;
      const targetProj = projects.find((p) => p.id.toString() === filterProjectId);
      if (!targetProj || !targetProj.members) return false;
      return targetProj.members.some((m) => m.username === u.username || m.id === u.id);
    };

    return matchesKeyword && matchesDept && matchesTeam && matchesProject();
  });

  // Action Handlers
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUserApi({
        username: createForm.username,
        email: createForm.email,
        password: createForm.password,
        fullName: createForm.fullName,
        role: createForm.role,
        departmentId: createForm.departmentId ? Number(createForm.departmentId) : null,
      });
      setIsCreateModalOpen(false);
      setCreateForm({
        username: '',
        email: '',
        password: '',
        fullName: '',
        role: 'EMPLOYEE',
        departmentId: '',
      });
      toast.success('Tạo tài khoản người dùng mới thành công!');
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  const handleOpenEditModal = (u: UserDTO) => {
    setSelectedUser(u);
    setEditForm({
      email: u.email,
      fullName: u.fullName,
      isActive: u.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await updateUserApi(selectedUser.id, editForm);
      setIsEditModalOpen(false);
      toast.success(`Cập nhật tài khoản ${selectedUser.username} thành công!`);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (
          err.message.includes('REASSIGNMENT_REQUIRED') || 
          err.message.toLowerCase().includes('bàn giao công việc') || 
          err.message.toLowerCase().includes('công việc được giao')
        ) {
          const candidates = users.filter(
            (u) => u.isActive && u.id !== selectedUser.id && u.role === 'EMPLOYEE' && (selectedUser.departmentId == null || u.departmentId === selectedUser.departmentId)
          );
          if (candidates.length > 0) {
            setReassignActionType('INACTIVATE');
            setTargetUserForReassign(selectedUser);
            setPendingUpdateForm(editForm);
            setReplacementCandidates(candidates);
            setSelectedReplacementId(candidates[0].id);
            setIsEditModalOpen(false);
            setIsReassignModalOpen(true);
            return;
          }
        }
        toast.error(err.message);
      }
    }
  };

  const handleOpenResetPwd = (u: UserDTO) => {
    setSelectedUser(u);
    setResetPwdInput('');
    setIsResetPwdModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await resetPasswordApi(selectedUser.id, { newPassword: resetPwdInput });
      setIsResetPwdModalOpen(false);
      toast.success(`Đã đặt lại mật khẩu cho tài khoản ${selectedUser.username}!`);
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    }
  };



  const handleConfirmReassignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserForReassign || !selectedReplacementId) return;
    try {
      if (reassignActionType === 'PROMOTE') {
        await assignRoleApi(targetUserForReassign.id, {
          role: 'LEADER',
          reassignToUserId: selectedReplacementId,
        });
        toast.success(`Đã nâng cấp ${targetUserForReassign.fullName} thành Trưởng phòng và bàn giao công việc thành công!`);
      } else if (reassignActionType === 'INACTIVATE') {
        if (!pendingUpdateForm) return;
        await updateUserApi(targetUserForReassign.id, {
          ...pendingUpdateForm,
          reassignToUserId: selectedReplacementId,
        });
        toast.success(`Đã khóa tài khoản ${targetUserForReassign.username} và bàn giao công việc thành công!`);
      } else if (reassignActionType === 'DELETE') {
        await deleteUserApi(targetUserForReassign.id, selectedReplacementId);
        toast.success(`Đã bàn giao công việc và xóa tài khoản ${targetUserForReassign.username}!`);
      }

      setIsReassignModalOpen(false);
      setTargetUserForReassign(null);
      setPendingUpdateForm(null);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  const handleDepartmentChange = async (userId: number, deptIdStr: string) => {
    try {
      const deptId = deptIdStr === '' ? null : Number(deptIdStr);
      await assignDepartmentApi(userId, { departmentId: deptId });
      toast.success('Gán phòng ban thành công!');
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  const handleDeleteUser = async (u: UserDTO) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${u.username}" (${u.fullName})?`)) {
      return;
    }
    try {
      await deleteUserApi(u.id);
      toast.success(`Đã xóa tài khoản ${u.username}!`);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (
          err.message.includes('REASSIGNMENT_REQUIRED') || 
          err.message.toLowerCase().includes('bàn giao công việc') || 
          err.message.toLowerCase().includes('công việc được giao')
        ) {
          const candidates = users.filter(
            (c) => c.isActive && c.id !== u.id && c.role === 'EMPLOYEE' && (u.departmentId == null || c.departmentId === u.departmentId)
          );
          if (candidates.length > 0) {
            setReassignActionType('DELETE');
            setTargetUserForReassign(u);
            setReplacementCandidates(candidates);
            setSelectedReplacementId(candidates[0].id);
            setIsReassignModalOpen(true);
            return;
          }
        }
        toast.error(err.message);
      }
    }
  };

  return (
    <AdminLayout title="Quản lý Tài khoản & Phân quyền">
      <div className="page-container">

        {/* Toolbar Header */}
        <div className="toolbar-panel">
          <div className="toolbar-search-group">
            <div className="search-input-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Tìm theo Tên, Username hoặc Email..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>

            <div className="filter-select-box">
              <Users size={16} className="filter-icon" />
              <select
                value={filterTeamId}
                onChange={(e) => setFilterTeamId(e.target.value)}
              >
                <option value="ALL">Tất cả Đội nhóm</option>
                <option value="NONE">Chưa phân Đội nhóm</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id.toString()}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-select-box">
              <Building2 size={16} className="filter-icon" />
              <select
                value={filterDepartmentId}
                onChange={(e) => setFilterDepartmentId(e.target.value)}
              >
                <option value="ALL">Tất cả Phòng ban</option>
                <option value="NONE">Chưa gán phòng ban</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id.toString()}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-select-box">
              <FolderKanban size={16} className="filter-icon" />
              <select
                value={filterProjectId}
                onChange={(e) => setFilterProjectId(e.target.value)}
              >
                <option value="ALL">Tất cả Dự án</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id.toString()}>
                    {p.name} ({p.departmentName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <UserPlus size={18} />
            <span>Thêm tài khoản mới</span>
          </button>
        </div>

        {/* User Table */}
        <div className="table-card-panel">
          {loading ? (
            <div className="loading-state">Đang tải danh sách tài khoản...</div>
          ) : (
            <div className="table-responsive">
              <table className="user-data-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Họ và Tên / Username</th>
                    <th>Email</th>
                    <th>Đội nhóm (Team)</th>
                    <th>Phòng ban (Gán PB)</th>
                    <th>Trạng thái</th>
                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, idx) => {
                    const userDept = departments.find((d) => d.id === u.departmentId);
                    const userTeamName = userDept?.teamName;

                    return (
                      <tr key={u.id}>
                        <td>{idx + 1}</td>
                        <td>
                          <div className="user-name-cell">
                            <span className="user-fullname">{u.fullName}</span>
                            <span className="user-username">@{u.username}</span>
                          </div>
                        </td>
                        <td className="text-secondary">{u.email}</td>
                        <td>
                          <span className={`user-team-badge ${userTeamName ? 'has-team' : 'no-team'}`}>
                            <Users size={12} />
                            {userTeamName || 'Chưa gán đội'}
                          </span>
                        </td>
                        <td>
                          {u.role === 'ADMIN' ? (
                            <span className="text-secondary" style={{ fontSize: '13px', color: 'var(--color-text-disabled)' }}>
                              ADMIN
                            </span>
                          ) : (
                            <select
                              className="select-dept"
                              value={u.departmentId ?? ''}
                              onChange={(e) => handleDepartmentChange(u.id, e.target.value)}
                            >
                              <option value="">-- Chưa gán --</option>
                              {departments.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td>
                          <span className={`status-pill ${u.isActive ? 'active' : 'inactive'}`}>
                            {u.isActive ? (
                              <>
                                <CheckCircle size={12} /> Hoạt động
                              </>
                            ) : (
                              <>
                                <XCircle size={12} /> Tạm khóa
                              </>
                            )}
                          </span>
                        </td>
                        <td>
                          {u.role === 'ADMIN' ? (
                            <div className="action-buttons">
                              <button
                                className="btn-icon edit"
                                disabled
                                style={{ opacity: 0.35, cursor: 'not-allowed' }}
                                title="Khóa: Không thể thao tác trên tài khoản Admin"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                className="btn-icon key"
                                disabled
                                style={{ opacity: 0.35, cursor: 'not-allowed' }}
                                title="Khóa: Không thể thao tác trên tài khoản Admin"
                              >
                                <Key size={16} />
                              </button>
                              <button
                                className="btn-icon delete"
                                disabled
                                style={{ opacity: 0.35, cursor: 'not-allowed' }}
                                title="Khóa: Không thể thao tác trên tài khoản Admin"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="action-buttons">
                              <button
                                className="btn-icon edit"
                                onClick={() => handleOpenEditModal(u)}
                                title="Sửa thông tin"
                              >
                                <Edit3 size={16} />
                              </button>

                              <button
                                className="btn-icon key"
                                onClick={() => handleOpenResetPwd(u)}
                                title="Reset mật khẩu"
                              >
                                <Key size={16} />
                              </button>

                              <button
                                className="btn-icon delete"
                                onClick={() => handleDeleteUser(u)}
                                title="Xóa tài khoản"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="empty-table-cell">
                        Không tìm thấy tài khoản nào khớp với bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE USER MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Thêm tài khoản người dùng mới"
      >
        <form onSubmit={handleCreateUser} className="modal-form">
          <div className="form-group">
            <label>Tên đăng nhập (Username) *</label>
            <input
              type="text"
              required
              placeholder="VD: nguyenvana"
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Địa chỉ Email *</label>
            <input
              type="email"
              required
              placeholder="VD: an@company.com"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu khởi tạo *</label>
            <input
              type="password"
              required
              placeholder="Tối thiểu 6 ký tự"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Họ và Tên đầy đủ *</label>
            <input
              type="text"
              required
              placeholder="VD: Nguyễn Văn An"
              value={createForm.fullName}
              onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Vai trò hệ thống *</label>
              <select
                value={createForm.role}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    role: e.target.value as 'LEADER' | 'EMPLOYEE',
                  })
                }
              >
                <option value="EMPLOYEE">EMPLOYEE (Nhân viên)</option>
                <option value="LEADER">LEADER (Trưởng phòng)</option>
              </select>
            </div>

            <div className="form-group flex-1">
              <label>Phòng ban trực thuộc</label>
              <select
                value={createForm.departmentId}
                onChange={(e) => setCreateForm({ ...createForm, departmentId: e.target.value })}
              >
                <option value="">-- Chưa gán phòng ban --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
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
              Tạo tài khoản
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Chỉnh sửa tài khoản: ${selectedUser?.username}`}
      >
        <form onSubmit={handleUpdateUser} className="modal-form">
          <div className="form-group">
            <label>Họ và Tên đầy đủ *</label>
            <input
              type="text"
              required
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              required
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Trạng thái tài khoản</label>
            <select
              value={editForm.isActive ? 'true' : 'false'}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
            >
              <option value="true">Đang hoạt động (Active)</option>
              <option value="false">Khóa tài khoản (Inactive)</option>
            </select>
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

      {/* RESET PASSWORD MODAL */}
      <Modal
        isOpen={isResetPwdModalOpen}
        onClose={() => setIsResetPwdModalOpen(false)}
        title={`Reset mật khẩu cho tài khoản: ${selectedUser?.username}`}
      >
        <form onSubmit={handleResetPassword} className="modal-form">
          <div className="form-group">
            <label>Mật khẩu mới *</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Nhập mật khẩu mới (Tối thiểu 6 ký tự)"
              value={resetPwdInput}
              onChange={(e) => setResetPwdInput(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsResetPwdModalOpen(false)}
            >
              Hủy bỏ
            </button>
            <button type="submit" className="btn-primary">
              Xác nhận Reset Mật khẩu
            </button>
          </div>
        </form>
      </Modal>

      {/* REASSIGN TASK MODAL */}
      <Modal
        isOpen={isReassignModalOpen}
        onClose={() => {
          setIsReassignModalOpen(false);
          setTargetUserForReassign(null);
          setPendingUpdateForm(null);
        }}
        title={
          reassignActionType === 'PROMOTE'
            ? 'Bàn giao công việc khi nâng cấp Trưởng phòng'
            : reassignActionType === 'INACTIVATE'
            ? 'Bàn giao công việc trước khi khóa tài khoản'
            : 'Bàn giao công việc trước khi xóa tài khoản'
        }
      >
        <form onSubmit={handleConfirmReassignment} className="modal-form">
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
            {reassignActionType === 'PROMOTE' && (
              <>
                Tài khoản <strong>{targetUserForReassign?.fullName}</strong> (@{targetUserForReassign?.username}) đang là Nhân viên thuộc phòng <strong>{targetUserForReassign?.departmentName || 'Chưa gán PB'}</strong>. Khi nâng cấp thành Trưởng phòng, các công việc hiện tại của tài khoản này phải được bàn giao lại cho nhân viên khác.
              </>
            )}
            {reassignActionType === 'INACTIVATE' && (
              <>
                Tài khoản <strong>{targetUserForReassign?.fullName}</strong> (@{targetUserForReassign?.username}) hiện đang có các công việc được giao. Vui lòng chọn nhân viên trong cùng phòng ban để bàn giao lại công việc trước khi khóa tài khoản.
              </>
            )}
            {reassignActionType === 'DELETE' && (
              <>
                Tài khoản <strong>{targetUserForReassign?.fullName}</strong> (@{targetUserForReassign?.username}) hiện đang có các công việc được giao. Vui lòng chọn nhân viên trong cùng phòng ban để bàn giao lại công việc trước khi xóa vĩnh viễn tài khoản.
              </>
            )}
          </p>

          <div className="form-group">
            <label>Chọn nhân viên trong cùng phòng nhận bàn giao công việc *</label>
            <select
              required
              value={selectedReplacementId || ''}
              onChange={(e) => setSelectedReplacementId(Number(e.target.value))}
            >
              {replacementCandidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} (@{c.username}) {c.departmentName ? `- ${c.departmentName}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions" style={{ marginTop: '24px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsReassignModalOpen(false);
                setTargetUserForReassign(null);
                setPendingUpdateForm(null);
              }}
            >
              Hủy bỏ
            </button>
            <button type="submit" className="btn-primary">
              {reassignActionType === 'PROMOTE' && 'Xác nhận bàn giao & Đổi quyền'}
              {reassignActionType === 'INACTIVATE' && 'Xác nhận bàn giao & Khóa tài khoản'}
              {reassignActionType === 'DELETE' && 'Xác nhận bàn giao & Xóa tài khoản'}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}

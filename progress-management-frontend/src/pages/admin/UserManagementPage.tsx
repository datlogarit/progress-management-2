import React, { useEffect, useState } from 'react';
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
import { 
  UserPlus, 
  Search, 
  Key, 
  Building2, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  XCircle, 
  Filter 
} from 'lucide-react';
import './UserManagementPage.css';

export function UserManagementPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter State
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [filterDepartmentId, setFilterDepartmentId] = useState<string>('ALL');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);

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
      setError(null);
      const [usersData, deptsData] = await Promise.all([
        getAllUsersApi(),
        getAllDepartmentsApi(),
      ]);
      setUsers(usersData);
      setDepartments(deptsData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Không thể tải danh sách tài khoản');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Display notification message
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesKeyword = 
      u.fullName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      u.username.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      u.email.toLowerCase().includes(searchKeyword.toLowerCase());

    const matchesDept = 
      filterDepartmentId === 'ALL' || 
      (filterDepartmentId === 'NONE' && u.departmentId === null) ||
      u.departmentId?.toString() === filterDepartmentId;

    const matchesRole = 
      filterRole === 'ALL' || u.role === filterRole;

    return matchesKeyword && matchesDept && matchesRole;
  });

  // Action Handlers
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
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
      showSuccess('Tạo tài khoản người dùng mới thành công!');
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
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
      setError(null);
      await updateUserApi(selectedUser.id, editForm);
      setIsEditModalOpen(false);
      showSuccess(`Cập nhật tài khoản ${selectedUser.username} thành công!`);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
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
      setError(null);
      await resetPasswordApi(selectedUser.id, { newPassword: resetPwdInput });
      setIsResetPwdModalOpen(false);
      showSuccess(`Đã đặt lại mật khẩu cho tài khoản ${selectedUser.username}!`);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  };

  const handleRoleChange = async (userId: number, newRole: 'ADMIN' | 'LEADER' | 'EMPLOYEE') => {
    try {
      setError(null);
      await assignRoleApi(userId, { role: newRole });
      showSuccess('Cập nhật vai trò (Role) thành công!');
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  };

  const handleDepartmentChange = async (userId: number, deptIdStr: string) => {
    try {
      setError(null);
      const deptId = deptIdStr === '' ? null : Number(deptIdStr);
      await assignDepartmentApi(userId, { departmentId: deptId });
      showSuccess('Gán phòng ban thành công!');
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  };

  const handleDeleteUser = async (u: UserDTO) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${u.username}" (${u.fullName})?`)) {
      return;
    }
    try {
      setError(null);
      await deleteUserApi(u.id);
      showSuccess(`Đã xóa tài khoản ${u.username}!`);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  };

  return (
    <AdminLayout title="Quản lý Tài khoản & Phân quyền">
      <div className="page-container">
        {/* Banner Alert Messages */}
        {successMsg && <div className="alert-banner success">{successMsg}</div>}
        {error && <div className="alert-banner danger">{error}</div>}

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
              <Filter size={16} className="filter-icon" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="ALL">Tất cả Vai trò</option>
                <option value="ADMIN">ADMIN</option>
                <option value="LEADER">LEADER</option>
                <option value="EMPLOYEE">EMPLOYEE</option>
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
                    <th>Vai trò (Gán quyền)</th>
                    <th>Phòng ban (Gán PB)</th>
                    <th>Trạng thái</th>
                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, idx) => (
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
                        <select
                          className={`select-badge role-${u.role.toLowerCase()}`}
                          value={u.role}
                          onChange={(e) =>
                            handleRoleChange(
                              u.id,
                              e.target.value as 'ADMIN' | 'LEADER' | 'EMPLOYEE'
                            )
                          }
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="LEADER">LEADER</option>
                          <option value="EMPLOYEE">EMPLOYEE</option>
                        </select>
                      </td>
                      <td>
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
                      </td>
                    </tr>
                  ))}

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
                    role: e.target.value as 'ADMIN' | 'LEADER' | 'EMPLOYEE',
                  })
                }
              >
                <option value="EMPLOYEE">EMPLOYEE (Nhân viên)</option>
                <option value="LEADER">LEADER (Trưởng phòng)</option>
                <option value="ADMIN">ADMIN (Quản trị viên)</option>
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
    </AdminLayout>
  );
}

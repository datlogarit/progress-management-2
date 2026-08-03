# Hệ thống Quản lý Công việc Phòng ban - Tài liệu Mô tả Dự án

## 1. Tổng quan

**Tên dự án:** Hệ thống Quản lý Công việc Phòng ban (Task Management System)

**Mục đích:** Xây dựng ứng dụng nội bộ hỗ trợ phân công, theo dõi và cập nhật tiến độ công việc trong phạm vi một phòng ban/nhóm. Hệ thống thay thế việc giao việc qua chat/email rời rạc bằng một công cụ tập trung, có lưu vết lịch sử và thông báo real-time.

**Quy mô:** Đơn giản, phù hợp một phòng ban hoặc nhóm nhỏ trong doanh nghiệp.

**Vai trò trong hệ thống:** 3 tác nhân — `Admin`, `Leader`, `Employee`.

---

## 2. Tác nhân và Chức năng

### 2.1. Admin

| Chức năng         | Mô tả                                                 |
| ----------------- | ----------------------------------------------------- |
| Quản lý tài khoản | Thêm / Sửa / Xóa tài khoản người dùng                 |
| Quản lý phòng ban | Thêm / Sửa / Xóa phòng ban                            |
| Gán quyền         | Gán vai trò cho người dùng: Admin / Leader / Employee |
| Gán phòng ban     | Gán người dùng vào phòng ban tương ứng                |

### 2.2. Leader

| Chức năng      | Mô tả                                                                                |
| -------------- | ------------------------------------------------------------------------------------ |
| Tạo task       | Tạo công việc mới trong phạm vi phòng ban                                            |
| Gán task       | Giao task cho nhân viên (Employee) cụ thể                                            |
| Comment task   | Trao đổi/thảo luận trực tiếp trên từng task                                          |
| Nhận thông báo | Nhận thông báo khi: task đổi trạng thái, có comment mới trên task mình phụ trách/tạo |

### 2.3. Employee

| Chức năng        | Mô tả                                                                       |
| ---------------- | --------------------------------------------------------------------------- |
| Nhận task        | Xem danh sách task được giao                                                |
| Cập nhật tiến độ | Cập nhật trạng thái/tiến độ của task (VD: Chưa làm / Đang làm / Hoàn thành) |
| Comment task     | Trao đổi/thảo luận trên task được giao                                      |
| Nhận thông báo   | Nhận thông báo khi: được gán task mới, có comment mới trên task của mình    |

---

## 3. Ma trận phân quyền tóm tắt

| Chức năng                     | Admin | Leader |      Employee      |
| ----------------------------- | :---: | :----: | :----------------: |
| Quản lý tài khoản, phòng ban  |  ✅   |   ❌   |         ❌         |
| Gán quyền / gán phòng ban     |  ✅   |   ❌   |         ❌         |
| Tạo task                      |  ❌   |   ✅   |         ❌         |
| Gán task                      |  ❌   |   ✅   |         ❌         |
| Cập nhật tiến độ task         |  ❌   |   ❌   | ✅ (task của mình) |
| Comment trên task             |  ❌   |   ✅   |         ✅         |
| Nhận thông báo đổi trạng thái |  ❌   |   ✅   |         —          |
| Nhận thông báo comment mới    |  ❌   |   ✅   |         ✅         |
| Nhận thông báo được gán task  |  ❌   |   —    |         ✅         |

---

## 4. Thực thể dữ liệu chính (gợi ý)

- **User**: tài khoản người dùng, thuộc một phòng ban, có một vai trò (role)
- **Role**: Admin / Leader / Employee
- **Department**: phòng ban
- **Task**: công việc, có người tạo (Leader), người được gán (Employee), trạng thái
- **Comment**: bình luận gắn với một task, thuộc về một User
- **Notification**: thông báo gửi đến một User, phát sinh từ sự kiện (đổi trạng thái task / comment mới / được gán task)

---

## 5. Luồng nghiệp vụ chính

1. Admin tạo tài khoản, gán phòng ban và vai trò cho người dùng.
2. Leader tạo task và gán cho Employee trong phòng ban của mình.
3. Employee nhận thông báo có task mới → thực hiện → cập nhật tiến độ/trạng thái.
4. Leader nhận thông báo khi trạng thái task thay đổi.
5. Cả Leader và Employee có thể comment trên task; người còn lại nhận thông báo khi có comment mới.

---

## 6. Ghi chú thiết kế

- Hệ thống ở mức đơn giản, chưa bao gồm: deadline nâng cao, file đính kèm, báo cáo/thống kê, phân quyền chi tiết theo dự án.
- Có thể mở rộng thêm các chức năng trên trong giai đoạn sau mà không phá vỡ cấu trúc 3 vai trò hiện tại.

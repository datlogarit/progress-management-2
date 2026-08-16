# Design System — Hệ thống quản lý

**Tinh thần thiết kế:** "Phòng điều khiển" — điềm tĩnh, chính xác, dễ đọc trong nhiều giờ làm việc. Ưu tiên độ tương phản rõ ràng và phân cấp thông tin mạch lạc thay vì trang trí.

---

## 1. Bảng màu

| Tên              | Mã hex    | Vai trò                                      |
| ---------------- | --------- | -------------------------------------------- |
| Nền (Background) | `#F7F8FA` | Nền trang, vùng ngoài các khối nội dung      |
| Bề mặt (Surface) | `#FFFFFF` | Card, bảng, modal, sidebar nội dung          |
| Ink / Navy       | `#1B2430` | Chữ chính, nền sidebar/vùng tối              |
| Text phụ         | `#5C6773` | Mô tả, nhãn phụ, chú thích                   |
| Viền / Line      | `#E2E6EB` | Đường viền, dòng phân cách bảng              |
| Primary — Teal   | `#1F6F78` | Nút hành động chính, link, trạng thái active |
| Primary Dark     | `#154F56` | Hover/pressed state của primary, tiêu đề mục |
| Success          | `#2F9E58` | Trạng thái hoàn tất, số liệu tăng            |
| Warning          | `#C67C1E` | Trạng thái chờ xử lý, cảnh báo               |
| Danger           | `#C1443D` | Lỗi, số liệu giảm, hành động xoá             |

**Nguyên tắc dùng màu:**

- Teal chỉ dùng cho hành động/chỉ báo quan trọng — không lạm dụng để giữ độ nổi bật.
- Nhóm màu ngữ nghĩa (success/warning/danger) chỉ dùng cho trạng thái dữ liệu thực, không dùng trang trí.
- Nền tối (Navy) chỉ áp dụng cho sidebar hoặc vùng điều hướng, không dùng cho nội dung chính để tránh mỏi mắt khi đọc lâu.

---

## 2. Typography

| Vai trò                 | Font          | Trọng lượng | Cỡ tham khảo | Ghi chú                                                                 |
| ----------------------- | ------------- | ----------- | ------------ | ----------------------------------------------------------------------- |
| Display / tiêu đề trang | Space Grotesk | 700         | 28–34px      | Cá tính kỹ thuật, dùng tiết chế cho tiêu đề lớn                         |
| Heading / tiêu đề mục   | Space Grotesk | 600         | 16–18px      | Tiêu đề bảng, tiêu đề card                                              |
| Body / nội dung         | IBM Plex Sans | 400         | 14–15px      | Đoạn văn, mô tả, form                                                   |
| UI label                | IBM Plex Sans | 500         | 12–13px      | Nhãn nút, nhãn trạng thái, viết hoa + letter-spacing nhẹ                |
| Số liệu / dữ liệu       | IBM Plex Mono | 400–500     | 13–15px      | Bảng số, mã đơn hàng, tiền tệ — dùng tabular numerals để cột thẳng hàng |

**Lý do lựa chọn:**

- **Space Grotesk**: hình học, rõ nét, tạo điểm nhấn cho tiêu đề mà không quá phổ biến như các font mặc định.
- **IBM Plex Sans**: được IBM thiết kế riêng cho phần mềm doanh nghiệp, tối ưu độ đọc ở cỡ nhỏ và mật độ thông tin cao — phù hợp bản chất "quản lý, vận hành" của hệ thống.
- **IBM Plex Mono**: cùng họ với Plex Sans nên đồng bộ thị giác, dùng riêng cho số liệu để đảm bảo căn chỉnh cột chính xác.

---

## 3. Chi tiết đặc trưng (Signature)

**Viền chỉ báo (status thread):** thanh màu teal rộng 3px, bo góc nhẹ, đặt bên trái mục menu đang được chọn trong sidebar nền tối. Ý tưởng mượn từ đèn báo trên bảng điều khiển thiết bị, giúp người dùng định vị nhanh vị trí hiện tại khi làm việc với giao diện nhiều dữ liệu.

---

## 4. CSS variables tham khảo

```css
:root {
  --bg: #f7f8fa;
  --surface: #ffffff;
  --ink: #1b2430;
  --ink-2: #5c6773;
  --line: #e2e6eb;
  --primary: #1f6f78;
  --primary-dark: #154f56;
  --navy: #1b2430;
  --amber: #c67c1e;
  --green: #2f9e58;
  --red: #c1443d;

  --font-display: "Space Grotesk", sans-serif;
  --font-body: "IBM Plex Sans", sans-serif;
  --font-mono: "IBM Plex Mono", monospace;
}
```

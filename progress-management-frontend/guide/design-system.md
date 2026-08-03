# Design System — Dashboard nội bộ

Tài liệu thiết kế dùng làm tham chiếu khi xây dựng giao diện (dashboard, bảng công việc, trang quản trị nội bộ). Áp dụng nhất quán màu sắc, typography, spacing bên dưới cho mọi component mới.

---

## 1. Phong cách thiết kế tổng thể

**Cảm giác hướng tới:** chuyên nghiệp, gọn gàng, dễ quét thông tin nhanh — phù hợp môi trường làm việc nội bộ công ty công nghệ.

Nguyên tắc áp dụng:

- Layout rõ ràng, nhiều khoảng trắng (whitespace), không nhồi nhét thông tin.
- Phân cấp thông tin bằng **độ đậm + kích thước chữ**, không lạm dụng màu sắc để nhấn mạnh.
- Card là đơn vị bố cục chính — mỗi khối thông tin (số liệu, bảng, biểu đồ) nằm trong 1 card riêng biệt, có ranh giới rõ (shadow nhẹ, không cần border đậm).
- Trạng thái (thành công/cảnh báo/chờ) dùng màu để nhận diện tức thì, nhất quán ở mọi nơi xuất hiện (badge, biểu đồ, icon).

---

## 2. Bảng màu

| Vai trò                         | Tên màu                   | Hex       | Ghi chú sử dụng                                                |
| ------------------------------- | ------------------------- | --------- | -------------------------------------------------------------- |
| Sidebar nền                     | Xám than đậm (dark slate) | `#1E293B` | Tương phản với nội dung; text trên sidebar dùng trắng/xám sáng |
| Sidebar nền (đậm hơn, tuỳ chọn) | Slate 900                 | `#0F172A` | Nếu muốn tương phản mạnh hơn với nền trang                     |
| Nền trang chính                 | Xám rất nhạt              | `#F8FAFC` | Nền tổng thể, không dùng trắng thuần để card nổi bật hơn       |
| Nền card                        | Trắng                     | `#FFFFFF` | Luôn kèm shadow nhẹ, bo góc — xem mục Elevation                |
| Màu nhấn chính (accent)         | Indigo                    | `#4F46E5` | Nút chính, link, icon active, border input khi focus           |
| Accent — hover                  | Indigo đậm hơn            | `#4338CA` | Trạng thái hover của accent                                    |
| Accent — nền nhạt               | Indigo 50                 | `#EEF2FF` | Nền cho item sidebar đang active, badge liên quan accent       |
| Trạng thái thành công           | Xanh lá                   | `#16A34A` | Task hoàn thành, tăng trưởng dương                             |
| Thành công — nền nhạt           | Green 50                  | `#F0FDF4` | Nền badge/pill trạng thái thành công                           |
| Trạng thái cảnh báo/trễ hạn     | Đỏ                        | `#DC2626` | Task quá hạn, giảm, lỗi                                        |
| Cảnh báo — nền nhạt             | Red 50                    | `#FEF2F2` | Nền badge/pill cảnh báo                                        |
| Trạng thái chờ                  | Vàng/Cam                  | `#D97706` | Pending, đang xử lý                                            |
| Chờ — nền nhạt                  | Amber 50                  | `#FFFBEB` | Nền badge/pill trạng thái chờ                                  |
| Text chính                      | Xám đen đậm               | `#0F172A` | Tiêu đề, nội dung quan trọng                                   |
| Text phụ                        | Xám trung tính            | `#64748B` | Mô tả, nhãn phụ, timestamp                                     |
| Text disabled/placeholder       | Xám nhạt                  | `#94A3B8` | Placeholder input, text vô hiệu                                |
| Border/divider                  | Xám rất nhạt              | `#E2E8F0` | Đường kẻ giữa row, border input mặc định                       |

**Nguyên tắc dùng màu trạng thái:** mỗi trạng thái (thành công/cảnh báo/chờ) luôn đi kèm cặp màu chữ đậm + nền nhạt tương ứng (ví dụ badge "Hoàn thành" = chữ `#16A34A` trên nền `#F0FDF4`) — không dùng màu đậm làm nền full vì gây chói, khó đọc trên diện rộng.

---

## 3. Typography

- **Font:** sans-serif hiện đại — `Inter` (ưu tiên), fallback `Roboto`, `system-ui`, `sans-serif`.
- **Tiêu đề trang** (ví dụ "Dashboard", "Bảng công việc"): đậm (weight 700), cỡ lớn — `24–28px`.
- **Số liệu nổi bật** (stat card, ví dụ doanh thu, tổng task): rất lớn, đậm (weight 700–800) — `32–36px`, dễ đọc từ xa, thường là điểm nhìn đầu tiên trên card.
- **Label phụ phía trên số liệu** (ví dụ "TODAY REVENUE"): chữ hoa toàn bộ (`text-transform: uppercase`), nhỏ — `11–12px`, weight 600, màu xám phụ (`#64748B`), có `letter-spacing` nhẹ (~0.05em) để tạo cảm giác nhãn/label rõ ràng, tách biệt phân cấp với số liệu chính bên dưới.
- **Text nội dung thường** (bảng, mô tả): `14px`, weight 400, màu text chính hoặc text phụ tùy ngữ cảnh.
- **Text nhỏ/caption** (timestamp, ghi chú): `12px`, weight 400, màu text phụ.

### Thang cỡ chữ tham khảo

| Cấp     | Kích thước | Weight          | Dùng cho               |
| ------- | ---------- | --------------- | ---------------------- |
| Display | 32–36px    | 700–800         | Số liệu stat card      |
| H1      | 24–28px    | 700             | Tiêu đề trang          |
| H2      | 18–20px    | 600             | Tiêu đề section/card   |
| Body    | 14px       | 400             | Nội dung chính, bảng   |
| Label   | 11–12px    | 600 (uppercase) | Nhãn phụ trên số liệu  |
| Caption | 12px       | 400             | Timestamp, ghi chú phụ |

---

## 4. Spacing & Layout

- Đơn vị spacing theo bội số của `4px` (4, 8, 12, 16, 24, 32...) — nhất quán khoảng cách giữa các phần tử, tránh số lẻ tùy hứng.
- Padding trong card: `20–24px`.
- Khoảng cách giữa các card trên cùng 1 hàng/grid: `16–24px`.
- Sidebar rộng cố định: `240–260px`.
- Content chính có max-width hoặc padding hai bên `24–32px` để không dính sát mép màn hình.

---

## 5. Elevation (Shadow) & Bo góc

- **Card:** bo góc `8–12px` (`border-radius`), shadow rất nhẹ để tạo cảm giác "nổi" mà không nặng nề:
  `box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04);`
- **Card khi hover** (nếu có thể click): shadow đậm hơn một chút, không đổi màu nền đột ngột.
- **Button:** bo góc `6–8px`.
- **Badge/pill trạng thái:** bo góc lớn, dạng viên thuốc (`border-radius: 9999px`), padding ngang `8–12px`, dọc `2–4px`.
- **Input:** bo góc `6px`, border `1px solid #E2E8F0`, khi focus đổi border sang accent `#4F46E5` kèm shadow nhẹ màu accent.

---

## 6. Component patterns

### Sidebar

- Nền `#1E293B`, text mặc định xám sáng (`#CBD5E1`), text/icon active chuyển sang trắng hoặc accent sáng, kèm nền item active dạng pill mờ (`rgba(79, 70, 229, 0.15)` hoặc tương đương trên nền tối).

### Stat card

- Label uppercase nhỏ phía trên → số liệu lớn đậm bên dưới → dòng phụ nhỏ thể hiện xu hướng (ví dụ "+12% so với tuần trước", màu xanh lá nếu tăng, đỏ nếu giảm).

### Bảng dữ liệu

- Header bảng: text phụ, uppercase nhỏ, weight 600, nền hơi khác row thường (`#F8FAFC`) hoặc chỉ có border-bottom đậm hơn.
- Row: border-bottom mảnh (`#E2E8F0`), hover nhẹ nền xám rất nhạt.
- Cột trạng thái: dùng badge màu theo mục 2 (thành công/cảnh báo/chờ).

### Nút (Button)

- **Primary:** nền accent `#4F46E5`, chữ trắng, hover đậm hơn `#4338CA`.
- **Secondary:** nền trắng, border `#E2E8F0`, chữ text chính, hover nền xám rất nhạt.
- **Danger:** nền/border đỏ `#DC2626` theo pattern tương tự primary.

---

## 7. CSS variables (dùng trực tiếp trong dự án)

```css
:root {
  /* Màu nền */
  --color-sidebar-bg: #1e293b;
  --color-page-bg: #f8fafc;
  --color-card-bg: #ffffff;

  /* Accent */
  --color-accent: #4f46e5;
  --color-accent-hover: #4338ca;
  --color-accent-subtle: #eef2ff;

  /* Trạng thái */
  --color-success: #16a34a;
  --color-success-subtle: #f0fdf4;
  --color-danger: #dc2626;
  --color-danger-subtle: #fef2f2;
  --color-warning: #d97706;
  --color-warning-subtle: #fffbeb;

  /* Text */
  --color-text-primary: #0f172a;
  --color-text-secondary: #64748b;
  --color-text-disabled: #94a3b8;

  /* Border */
  --color-border: #e2e8f0;

  /* Typography */
  --font-family-base: "Inter", Roboto, system-ui, sans-serif;
  --font-size-display: 34px;
  --font-size-h1: 26px;
  --font-size-h2: 19px;
  --font-size-body: 14px;
  --font-size-label: 12px;
  --font-size-caption: 12px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Radius & shadow */
  --radius-card: 10px;
  --radius-button: 8px;
  --radius-pill: 9999px;
  --shadow-card:
    0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04);
}
```

---

## 8. Ghi chú áp dụng

- Đây là tài liệu tham chiếu — khi tạo component mới, luôn tra lại bảng màu/typography ở trên thay vì tự chọn giá trị mới, để giao diện nhất quán toàn hệ thống.
- Nếu cần thêm biến thể (dark mode, theme khác), nên mở rộng từ bộ token này thay vì tạo bảng màu riêng biệt song song.

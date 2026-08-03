---
name: react-frontend-standard
description: Chuẩn code và cách tổ chức dự án frontend React cơ bản, dễ hiểu, phù hợp cho người mới bắt đầu với React (ví dụ dev backend chuyển sang làm frontend). Dùng skill này bất cứ khi nào người dùng viết, review, hoặc tổ chức code React — component, gọi API, quản lý state, form, routing, style. Cũng áp dụng khi người dùng hỏi "nên tổ chức thư mục React thế nào", "component viết vậy đã ổn chưa", "code React của tôi có theo chuẩn không", hoặc khi bắt đầu một dự án/trang React mới. Ưu tiên dùng skill này ngay cả khi người dùng không nói rõ từ "chuẩn" — chỉ cần đang viết code React là nên tham khảo. Skill này chủ đích dùng công nghệ tối giản (không Redux, không React Query, không TypeScript bắt buộc) để dễ tiếp cận; nếu người dùng đã rành React và muốn stack nâng cao hơn, hỏi lại trước khi áp dụng.
---

# React Frontend — Chuẩn cơ bản, dễ tiếp cận

Bộ quy ước tối giản cho dự án React, dùng cho người mới học React (đặc biệt dev có nền tảng backend). Mục tiêu: **ít khái niệm mới nhất có thể**, nhưng vẫn tổ chức code rõ ràng, dễ đọc, dễ mở rộng sau này — không phải viết tùy tiện.

**Công nghệ dùng trong skill này**: React thuần (JavaScript, không bắt buộc TypeScript) + Vite để khởi tạo dự án + React Router cho điều hướng nhiều trang + CSS thường (mỗi component 1 file CSS riêng). Không dùng Redux, React Query, Zustand, Zod hay thư viện quản lý state/form phức tạp — vì với dự án nhỏ/vừa, `useState` + `useEffect` là đủ.

## 1. Cấu trúc thư mục — đơn giản, theo loại file

Khác với dự án backend (tổ chức theo layer service/repository), ở đây tổ chức theo **loại thứ mà mỗi file đảm nhiệm** — dễ đoán một thứ nằm ở đâu:

```
src/
├── components/     # Các mảnh UI dùng lại nhiều nơi: Button, Header, LoadingSpinner
├── pages/          # Mỗi file = 1 trang hoàn chỉnh: LoginPage.jsx, UserListPage.jsx
├── services/       # Hàm gọi API, tách riêng khỏi component: userService.js
├── context/        # Dữ liệu dùng chung toàn app (ít khi cần): AuthContext.jsx
├── App.jsx         # Khai báo route, layout chung
└── main.jsx        # Điểm khởi động app
```

Quy tắc chọn chỗ để file mới:

- Là **1 trang** người dùng điều hướng tới (có URL riêng) → `pages/`
- Là **mảnh UI nhỏ** dùng lại ở ≥2 chỗ (nút bấm, thẻ card, ô loading...) → `components/`
- Là **hàm gọi API** (không phải UI) → `services/`
- Nếu dự án còn nhỏ (dưới ~10 trang), **không cần** chia thêm theo "feature" — để phẳng như trên cho dễ tìm. Chỉ khi dự án lớn hẳn lên mới cân nhắc gom theo tính năng.

## 2. Naming — quy ước tối thiểu cần nhớ

| Thành phần             | Quy ước                         | Ví dụ                               |
| ---------------------- | ------------------------------- | ----------------------------------- |
| File component         | PascalCase, trùng tên component | `UserCard.jsx`                      |
| Component              | PascalCase                      | `UserCard`, `LoginPage`             |
| File trang             | Hậu tố `Page`                   | `LoginPage.jsx`, `UserListPage.jsx` |
| Biến, hàm thường       | camelCase                       | `userName`, `handleClick`           |
| Hàm xử lý sự kiện      | Tiền tố `handle`                | `handleSubmit`, `handleDelete`      |
| Prop nhận hàm callback | Tiền tố `on`                    | `onSave`, `onCancel`                |
| File CSS               | Trùng tên component             | `UserCard.css`                      |

## 3. Component — chỉ cần biết function component

- Luôn viết **function component**, không cần biết tới class component (kiểu cũ, không dùng nữa).
- Mỗi file 1 component, tên file trùng tên component.
- Component nên nhỏ — nếu 1 file dài quá ~150 dòng hoặc làm quá nhiều việc khác nhau, tách bớt ra component con.

```jsx
// components/UserCard.jsx
function UserCard({ user, onSelect }) {
  return (
    <div className="user-card" onClick={() => onSelect(user.id)}>
      <p className="user-card__name">{user.fullName}</p>
      <p className="user-card__email">{user.email}</p>
    </div>
  );
}

export default UserCard;
```

- Không cần TypeScript ngay từ đầu. Nếu sau này dự án lớn hơn và muốn an toàn kiểu dữ liệu hơn, có thể học thêm TypeScript — nhưng không bắt buộc để bắt đầu.

## 4. State — chỉ cần `useState`, thêm `useContext` khi thật sự cần

- Mặc định dùng `useState` cho mọi state trong 1 component (input đang gõ, modal mở/đóng, danh sách dữ liệu...).
- Khi cần truyền 1 giá trị qua **nhiều tầng component** (ví dụ: thông tin người dùng đăng nhập, cần dùng ở cả Header lẫn Sidebar lẫn nhiều trang) → dùng `Context` (`createContext` + `useContext`), tránh phải truyền props qua từng tầng trung gian không cần dùng tới nó.
- Không cần học Redux/Zustand khi mới bắt đầu — phần lớn dự án vừa và nhỏ chỉ cần `useState` + Context là đủ. Khi nào dự án thực sự phức tạp (nhiều màn hình chia sẻ rất nhiều state qua lại), lúc đó mới cần cân nhắc thêm thư viện quản lý state.

```jsx
// context/AuthContext.jsx
import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

## 5. Gọi API — `fetch`/`axios` + `useState` + `useEffect`

- Tách hàm gọi API ra file riêng trong `services/`, component không gọi `fetch`/`axios` trực tiếp — để nếu sau này đổi URL hay cách gọi, chỉ sửa 1 chỗ.

```js
// services/userService.js
export async function getUsers() {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Không lấy được danh sách user");
  return res.json();
}
```

- Trong component, luôn quản lý đủ 3 trạng thái: **dữ liệu, đang tải, lỗi** — không chỉ code phần thành công (happy path):

```jsx
// pages/UserListPage.jsx
import { useState, useEffect } from "react";
import { getUsers } from "../services/userService";

function UserListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p>Có lỗi xảy ra: {error}</p>;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.fullName}</li>
      ))}
    </ul>
  );
}
```

- `useEffect` gọi API luôn có mảng dependency `[]` (chạy 1 lần khi component mount) trừ khi cố ý muốn gọi lại khi 1 giá trị nào đó đổi — khi đó liệt kê rõ giá trị đó trong mảng, không để trống gây bug gọi API liên tục.

## 6. Form — controlled input, validate bằng hàm JS thường

- Không cần thư viện form ngoài khi mới bắt đầu. Mỗi input gắn `value` + `onChange` vào state (controlled component):

```jsx
function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.includes("@")) {
      setErrorMessage("Email không hợp lệ");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Mật khẩu tối thiểu 8 ký tự");
      return;
    }
    setErrorMessage("");
    onSubmit({ email, password });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mật khẩu"
      />
      {errorMessage && <p className="error">{errorMessage}</p>}
      <button type="submit">Đăng nhập</button>
    </form>
  );
}
```

- Nếu form có nhiều field (>6-7 field) và việc quản lý từng `useState` bắt đầu thấy rườm rà, có thể cân nhắc gom state form vào **1 object** duy nhất thay vì nhiều biến `useState` riêng lẻ — đó là bước trung gian hợp lý trước khi cần tới thư viện form chuyên dụng.

## 7. Routing — React Router cơ bản

- Cài `react-router-dom`, khai báo route tập trung trong `App.jsx`:

```jsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Trang chủ</Link>
        <Link to="/users">Danh sách user</Link>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/users" element={<UserListPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- Dùng `<Link>` để chuyển trang, không dùng thẻ `<a href="...">` thường (sẽ load lại toàn bộ trang thay vì chuyển trang mượt trong React).

## 8. Style — CSS thường, mỗi component 1 file

- Mỗi component có file `.css` cùng tên, import trực tiếp vào file component — không cần học Tailwind hay CSS-in-JS ngay từ đầu.

```jsx
import "./UserCard.css";
```

- Đặt tên class theo kiểu `ten-component__phan-tu` (gần giống BEM) để tránh trùng tên class giữa các file CSS khác nhau: `.user-card`, `.user-card__name`.

## 9. Khi nào nên "nâng cấp" lên công cụ phức tạp hơn

Không cần học trước — chỉ cân nhắc khi thực sự gặp vấn đề tương ứng:

- Component gọi API lặp lại nhiều logic loading/error giống nhau, dự án lớn dần → cân nhắc **React Query**.
- State dùng chung phải truyền qua Context ở quá nhiều nơi, khó theo dõi → cân nhắc **Zustand/Redux**.
- Form phức tạp, nhiều validate rule lồng nhau → cân nhắc **React Hook Form**.
- Cần kiểm tra kiểu dữ liệu chặt chẽ hơn khi dự án lớn → cân nhắc **TypeScript**.

Nếu đến lúc đó, có thể hỏi lại để mình viết thêm phần nâng cao — không cần đưa hết vào từ đầu để tránh rối.

## 10. Khi review code

Kiểm tra theo thứ tự:

1. Component có đặt đúng chỗ không (`pages/` cho trang, `components/` cho UI dùng lại)?
2. Có gọi `fetch`/`axios` trực tiếp trong component thay vì qua `services/` không?
3. Có xử lý đủ loading/error, hay chỉ code phần thành công?
4. `useEffect` có dependency array đúng chưa (tránh gọi API lặp vô hạn)?
5. Naming có theo bảng ở mục 2 không?
6. Component có quá dài, nên tách nhỏ không?
7. Render danh sách có dùng `key` hợp lệ (id thật, không phải index nếu danh sách có thể thay đổi thứ tự) không?

Chỉ ra vấn đề cụ thể kèm dòng/đoạn code, giải thích ngắn gọn vì sao nên sửa — tránh dùng thuật ngữ khó nếu người dùng chưa quen React.

-- ============================================================
-- HỆ THỐNG QUẢN LÝ CÔNG VIỆC PHÒNG BAN
-- DDL PostgreSQL 
-- ============================================================

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================
CREATE TYPE role_enum AS ENUM ('ADMIN', 'LEADER', 'EMPLOYEE');
CREATE TYPE task_status_enum AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
CREATE TYPE notification_type_enum AS ENUM ('TASK_ASSIGNED', 'STATUS_CHANGED', 'NEW_COMMENT');

-- ============================================================
-- 2. BẢNG: departments
-- ============================================================
CREATE TABLE departments (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE departments IS 'Phòng ban trong doanh nghiệp';

-- ============================================================
-- 3. BẢNG: users
-- ============================================================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    email           VARCHAR(150) UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,          -- BCrypt hash, dùng để xác thực JWT login
    full_name       VARCHAR(100) NOT NULL,
    role            role_enum    NOT NULL,
    department_id   INT REFERENCES departments(id) ON DELETE SET NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- 4. BẢNG: tasks
-- ============================================================
CREATE TABLE tasks (
    id             SERIAL PRIMARY KEY,
    title          VARCHAR(255) NOT NULL,
    description    TEXT,
    department_id  INT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    created_by     INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,   -- Leader tạo task
    assigned_to    INT REFERENCES users(id) ON DELETE SET NULL,            -- Employee được gán
    status         VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    priority       VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    due_date       TIMESTAMP,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tasks IS 'Công việc được Leader tạo và gán cho Employee trong cùng phòng ban';

CREATE INDEX idx_tasks_department_id ON tasks(department_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);

-- ============================================================
-- 5. BẢNG: comments
-- ============================================================
CREATE TABLE comments (
    id          SERIAL PRIMARY KEY,
    task_id     INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE comments IS 'Bình luận trao đổi trên từng task, giữa Leader và Employee';

CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

-- ============================================================
-- 6. BẢNG: notifications
-- ============================================================
CREATE TABLE notifications (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,   -- người nhận
    type        VARCHAR(50) NOT NULL,
    task_id     INT REFERENCES tasks(id) ON DELETE CASCADE,
    comment_id  INT REFERENCES comments(id) ON DELETE CASCADE,
    message     VARCHAR(255) NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'Thông báo real-time: gán task mới, đổi trạng thái, comment mới';

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_task_id ON notifications(task_id);

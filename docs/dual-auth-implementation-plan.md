# 双认证系统（自建 JWT + Clerk）+ PostgreSQL 实现方案

## Context

用户有一个 macOS 桌面应用（数据存在本地 SQLite），计划扩展到多端（Flutter 等）。需要一个 Server 作为加密中转站，负责用户认证和多端数据同步。Server 不解读用户数据，只存储加密后的数据块。

本项目（Next.js 16 dashboard）将同时作为：
- **API 服务** — 供 Flutter/macOS 客户端调用（JWT 认证）
- **管理后台** — 供管理员使用（保留 Clerk 认证）

## 技术选型

| 层面 | 选择 | 理由 |
|------|------|------|
| ORM | Drizzle ORM | TypeScript-first，零运行时开销，Bun 兼容好 |
| JWT | jose | Edge runtime 兼容，无依赖，Next.js 推荐 |
| 密码哈希 | argon2 | Password Hashing Competition 冠军，抗 GPU 攻击 |
| 邮件发送 | Resend | 开发者友好，免费额度充足，Next.js 生态推荐 |
| 数据库 | PostgreSQL | 用户指定 |

## 核心设计：统一用户模型

通过 email 关联两套认证系统，同一个用户无论用哪种方式登录都对应同一条记录：

```
users 表
├── id (UUID, 主键)
├── email (唯一，两套认证的关联键)
├── password_hash (nullable, JWT 用户才有)
├── clerk_user_id (nullable, Clerk 用户才有)
├── registration_source (注册来源: jwt / clerk)
├── email_verified_at (邮箱验证时间)
├── full_name, avatar_url, ...
└── total_online_time (统计用)

RBAC 表（角色通过关联表分配，不在 users 上硬编码）
├── roles            → { id, name, description }
├── permissions      → { id, code, description }
├── role_permissions → { role_id, permission_id }  多对多
└── user_roles       → { user_id, role_id }        多对多
```

## 关键文件：Clerk Middleware 冲突处理

`src/proxy.ts` 的 matcher 包含 `/(api|trpc)(.*)`，会拦截所有 API 路由并要求 Clerk 认证。需要修改为：**API 路由不经过 Clerk 保护**。

**修改 `src/proxy.ts`**：
```typescript
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);
// API 路由不走 Clerk 保护，由自建 JWT 中间件处理
```
matcher 保持不变（Clerk 仍需处理 session），但 `auth.protect()` 只对 `/dashboard` 生效，`/api` 路由通过 JWT 自行保护。

---

## 实现阶段

### Phase 1: 数据库基础设施

**新增依赖**：
```bash
bun add drizzle-orm postgres argon2 jose resend
bun add -D drizzle-kit
```

**新增文件**：
- `src/server/db/index.ts` — 数据库连接
- `src/server/db/schema.ts` — 表定义
- `drizzle.config.ts` — Drizzle 配置

**表结构**：

```sql
-- ============================================================
-- users: 统一用户表，两套认证共用
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE,
  full_name VARCHAR(255),
  password_hash TEXT,                          -- nullable, JWT 用户才有
  clerk_user_id VARCHAR(255) UNIQUE,           -- nullable, Clerk 用户才有
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'user',    -- 'user' | 'admin'
  registration_source VARCHAR(20) NOT NULL,    -- 'jwt' | 'clerk'（首次注册来源）
  email_verified_at TIMESTAMP,                 -- 邮箱验证完成时间
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  total_online_time INTEGER DEFAULT 0          -- 秒，累计在线时长
);

-- ============================================================
-- email_verification_codes: 邮箱验证码
-- ============================================================
CREATE TABLE email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,                    -- 6 位数字验证码
  expires_at TIMESTAMP NOT NULL,               -- 过期时间（10 分钟）
  used_at TIMESTAMP,                           -- 使用时间（防重放）
  attempts INTEGER DEFAULT 0,                  -- 错误尝试次数（防暴力破解）
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_email_verification_codes_email ON email_verification_codes(email);

-- ============================================================
-- refresh_tokens: JWT 刷新令牌
-- ============================================================
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  device_id VARCHAR(255),                      -- 关联设备
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP
);

-- ============================================================
-- user_sessions: 用户登录会话记录
-- ============================================================
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,             -- 设备标识（客户端生成）
  device_name VARCHAR(255),                    -- 设备名称（如 "MacBook Pro"）
  device_type VARCHAR(50),                     -- 'macos' | 'ios' | 'android' | 'web'
  ip_address VARCHAR(45),                      -- 登录 IP（支持 IPv6）
  user_agent TEXT,                             -- 浏览器/客户端 UA
  login_at TIMESTAMP NOT NULL DEFAULT NOW(),   -- 登录时间
  last_active_at TIMESTAMP DEFAULT NOW(),      -- 最后活跃时间（心跳更新）
  logout_at TIMESTAMP,                         -- 登出时间（null 表示仍在线）
  duration INTEGER DEFAULT 0,                  -- 本次会话时长（秒，登出时计算）
  auth_method VARCHAR(20) NOT NULL             -- 'jwt' | 'clerk'（本次登录方式）
);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_device_id ON user_sessions(device_id);

-- ============================================================
-- sync_data: 客户端加密数据同步
-- ============================================================
CREATE TABLE sync_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  encrypted_data TEXT NOT NULL,                -- 客户端加密后的密文
  data_hash VARCHAR(64) NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  synced_at TIMESTAMP DEFAULT NOW()
);
```

**环境变量**（追加到 `.env.local`）：
```
DATABASE_URL="postgresql://user:password@localhost:5432/focus_flow"
JWT_ACCESS_SECRET="<openssl rand -base64 32>"
JWT_REFRESH_SECRET="<openssl rand -base64 32>"
RESEND_API_KEY="re_xxxxxxxxxx"
```

**迁移命令**：
```bash
bunx drizzle-kit generate
bunx drizzle-kit migrate
```

### Phase 2: 邮箱验证 + 注册流程

注册流程改为**两步式**：

```
Step 1: 发送验证码
  POST /api/auth/send-code  { email }
  → 生成 6 位验证码 → 存 email_verification_codes → 通过 Resend 发邮件
  → 返回 { success: true, message: "验证码已发送" }

Step 2: 验证码 + 设置密码（完成注册）
  POST /api/auth/register  { email, code, password, username?, full_name? }
  → 校验验证码（是否正确、是否过期、尝试次数 < 5）
  → 标记验证码已使用
  → 创建用户（email_verified_at = NOW(), registration_source = 'jwt'）
  → 创建 session 记录
  → 签发 tokens
  → 返回 { success: true, data: { user, access_token, refresh_token } }
```

**验证码安全策略**：
- 有效期 10 分钟
- 最多尝试 5 次（超过后该验证码作废，需重新发送）
- 同一邮箱 60 秒内不能重复发送（防刷）
- 验证码使用后立即标记 `used_at`（防重放）

**新增文件**：
- `src/server/email/resend.ts` — Resend 客户端初始化
- `src/server/email/templates.ts` — 邮件模板（验证码邮件）
- `src/server/auth/verification.ts` — 验证码生成、校验、发送逻辑
- `src/app/api/auth/send-code/route.ts` — 发送验证码 API

### Phase 3: JWT 认证核心

**新增文件**：
- `src/server/auth/jwt.ts` — Token 签发/验证（signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken）
- `src/server/auth/password.ts` — 密码哈希/验证（hashPassword, verifyPassword）
- `src/server/auth/middleware.ts` — `withJwtAuth()` 高阶函数，保护 API 路由；`withPermission()` 高阶函数，基于 RBAC 权限检查
- `src/server/repositories/user-repository.ts` — 用户 CRUD（findByEmail, findById, findByClerkId, create, update, linkClerkAccount）
- `src/server/auth/validation/schemas.ts` — Zod 校验（sendCodeSchema, registerSchema, loginSchema）

**JWT 设计细节**：
- Access Token: 15 分钟有效期，payload 包含 `{ sub: userId, email, role }`
- Refresh Token: 7 天有效期，存数据库，支持撤销
- Token 刷新时实施 Refresh Token Rotation（旧 token 立即作废）

### Phase 4: API 路由

**新增文件**：
```
src/app/api/
├── auth/
│   ├── send-code/route.ts    # POST: 发送邮箱验证码
│   ├── register/route.ts     # POST: 验证码 + 密码完成注册
│   ├── login/route.ts        # POST: 登录（验证密码 → 返回 tokens）
│   ├── refresh/route.ts      # POST: 刷新 token
│   ├── logout/route.ts       # POST: 登出（撤销 token + 关闭 session）
│   └── me/route.ts           # GET: 获取当前用户信息
├── sync/
│   ├── upload/route.ts       # POST: 上传加密数据块
│   └── download/route.ts     # GET: 下载最新加密数据
├── sessions/
│   ├── route.ts              # GET: 获取当前用户的所有会话
│   └── heartbeat/route.ts    # POST: 心跳更新（更新 last_active_at）
├── users/
│   └── stats/route.ts        # GET/POST: 用户统计
└── admin/
    ├── users/route.ts        # GET: 查看所有用户列表（admin 权限）
    └── users/[id]/route.ts   # GET: 查看单个用户详情（admin 权限）
```

**修改文件**：
- `src/proxy.ts` — 确保 API 路由不被 `auth.protect()` 拦截

**API 端点详细说明**：

#### POST /api/auth/send-code
- 输入：`{ email }`
- 逻辑：
  1. Zod 校验 email 格式
  2. 检查 60 秒内是否已发送（防刷）
  3. 生成 6 位随机数字验证码
  4. 存入 email_verification_codes（expires_at = NOW() + 10min）
  5. 通过 Resend 发送验证码邮件
- 输出：`{ success: true, message: "验证码已发送" }`

#### POST /api/auth/register
- 输入：`{ email, code, password, username?, full_name? }`
- 逻辑：
  1. Zod 校验输入（密码至少 8 位，含大小写字母和数字）
  2. 校验验证码（正确性、过期、尝试次数）
  3. 标记验证码已使用
  4. 检查 email 是否已存在：
     - 已存在且有 clerk_user_id 但无 password_hash → 关联账号
     - 已存在且有 password_hash → 返回 409 冲突
     - 不存在 → 创建新用户（registration_source = 'jwt'）
  5. 创建 user_session 记录
  6. 签发 access_token + refresh_token
- 输出：`{ success: true, data: { user, access_token, refresh_token } }`

#### POST /api/auth/login
- 输入：`{ email, password, device_id?, device_name?, device_type? }`
- 逻辑：
  1. 查找用户
  2. 检查 email_verified_at 是否非空（未验证不允许登录）
  3. 验证密码
  4. 更新 last_login_at
  5. 创建 user_session 记录
  6. 签发新 tokens
- 输出：`{ success: true, data: { user, access_token, refresh_token, session_id } }`

#### POST /api/auth/logout
- Header：`Authorization: Bearer <access_token>`
- 输入：`{ session_id?, refresh_token }`
- 逻辑：
  1. 撤销 refresh_token（设置 revoked_at）
  2. 关闭 session（设置 logout_at，计算 duration）
  3. 累加 duration 到 users.total_online_time
- 输出：`{ success: true }`

#### POST /api/auth/refresh
- 输入：`{ refresh_token }`
- 逻辑：
  1. 验证 refresh_token 签名
  2. 查数据库确认未被撤销
  3. 撤销旧 token（设置 revoked_at）
  4. 签发新 access_token + refresh_token
- 输出：`{ success: true, data: { access_token, refresh_token } }`

#### GET /api/auth/me
- Header：`Authorization: Bearer <access_token>`
- 逻辑：`withJwtAuth()` 中间件验证 token，返回用户信息
- 输出：`{ success: true, data: { user } }`

#### GET /api/sessions
- Header：`Authorization: Bearer <access_token>`
- 逻辑：返回当前用户所有会话记录（含在线状态判断）
- 输出：
  ```json
  {
    "success": true,
    "data": {
      "sessions": [
        {
          "id": "uuid",
          "device_id": "macbook-001",
          "device_name": "MacBook Pro",
          "device_type": "macos",
          "ip_address": "192.168.1.100",
          "login_at": "2026-02-16T10:00:00Z",
          "last_active_at": "2026-02-16T14:30:00Z",
          "logout_at": null,
          "is_current": true,
          "is_online": true,
          "duration": null,
          "auth_method": "jwt"
        }
      ]
    }
  }
  ```
- 在线判断：`logout_at IS NULL AND last_active_at > NOW() - INTERVAL '5 minutes'`

#### POST /api/sessions/heartbeat
- Header：`Authorization: Bearer <access_token>`
- 输入：`{ session_id }`
- 逻辑：更新 `last_active_at = NOW()`
- 输出：`{ success: true }`
- 客户端每 2 分钟调用一次

#### POST /api/sync/upload
- Header：`Authorization: Bearer <access_token>`
- 输入：`{ encrypted_data, data_hash, device_id }`
- 逻辑：存储加密数据块
- 输出：`{ success: true, data: { id, synced_at } }`

#### GET /api/sync/download
- Header：`Authorization: Bearer <access_token>`
- Query：`?device_id=xxx`
- 逻辑：返回该用户最新的加密数据
- 输出：`{ success: true, data: { encrypted_data, data_hash, synced_at } }`

#### GET/POST /api/users/stats
- Header：`Authorization: Bearer <access_token>`
- GET：返回用户统计信息
- POST：更新在线时长 `{ online_time: number }`（累加）
- 输出：`{ success: true, data: { total_online_time, last_login_at } }`

#### GET /api/admin/users （需要 admin 权限）
- Header：`Authorization: Bearer <access_token>`
- 权限：`withAdminAuth()` — 要求 `role = 'admin'`
- Query：`?page=1&limit=20&source=jwt|clerk&search=xxx`
- 逻辑：分页查询所有用户，支持按注册来源过滤、按 email/username 搜索
- 输出：
  ```json
  {
    "success": true,
    "data": {
      "users": [
        {
          "id": "uuid",
          "email": "user@test.com",
          "username": "testuser",
          "full_name": "Test User",
          "role": "user",
          "registration_source": "jwt",
          "email_verified_at": "2026-02-16T10:00:00Z",
          "has_password": true,
          "has_clerk": false,
          "created_at": "2026-02-16T09:00:00Z",
          "last_login_at": "2026-02-16T14:00:00Z",
          "total_online_time": 3600,
          "session_count": 5
        }
      ],
      "meta": {
        "total": 150,
        "page": 1,
        "limit": 20
      }
    }
  }
  ```

#### GET /api/admin/users/[id] （需要 admin 权限）
- Header：`Authorization: Bearer <access_token>`
- 权限：`withAdminAuth()`
- 逻辑：返回单个用户详细信息 + 最近会话记录
- 输出：
  ```json
  {
    "success": true,
    "data": {
      "user": { "...完整用户信息" },
      "recent_sessions": [
        {
          "device_name": "MacBook Pro",
          "device_type": "macos",
          "login_at": "...",
          "logout_at": "...",
          "duration": 7200,
          "auth_method": "jwt"
        }
      ]
    }
  }
  ```

### Phase 5: Clerk 用户同步

当用户通过 Clerk 登录管理后台时，需要同步到本地数据库。

**新增文件**：
- `src/server/auth/clerk-sync.ts` — 辅助函数：根据 Clerk userId 查找/创建本地用户

**修改文件**：
- `src/app/page.tsx` — 登录后调用 clerk-sync 确保本地数据库有对应记录
- `src/app/dashboard/page.tsx` — 同上

**账号关联逻辑**：
1. JWT 注册 → 创建 users 记录（有 password_hash，无 clerk_user_id，registration_source = 'jwt'）
2. 同一 email 通过 Clerk 登录 → 找到已有记录 → 填充 clerk_user_id
3. Clerk 先注册 → 创建记录（有 clerk_user_id，无 password_hash，registration_source = 'clerk'）
4. 同一 email 通过 JWT 注册 → 找到已有记录 → 填充 password_hash

**Clerk 同步时也创建 session**：
- auth_method = 'clerk'
- device_type = 'web'
- 从 request headers 提取 IP 和 User-Agent

### Phase 6: 统一 API 响应格式

所有 API 返回统一结构：
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}
```

辅助函数位于 `src/server/api-response.ts`：
```typescript
function successResponse<T>(data: T, meta?: Meta): NextResponse
function errorResponse(error: string, status: number): NextResponse
```

---

## 权限系统设计（RBAC）

通过独立的角色/权限表实现，不在 users 表上硬编码角色。

### 表结构

```
roles            → { id, name, description }
permissions      → { id, code, description }
role_permissions → { role_id, permission_id }  多对多
user_roles       → { user_id, role_id }        多对多
```

### 默认角色

| 角色 | 拥有的权限 | 说明 |
|------|-----------|------|
| `user` | `sync:upload`, `sync:download`, `stats:read`, `stats:write` | 默认角色，客户端注册用户 |
| `admin` | 全部权限 | 管理后台用户 |

### 权限列表

| 权限 code | 说明 |
|-----------|------|
| `admin:users:read` | 查看所有用户列表和详情 |
| `admin:users:write` | 修改用户信息 |
| `sync:upload` | 上传加密数据 |
| `sync:download` | 下载加密数据 |
| `stats:read` | 读取在线时长统计 |
| `stats:write` | 更新在线时长统计 |

### 权限中间件

```typescript
// 普通 JWT 认证（所有登录用户可访问）
withJwtAuth(handler)

// 基于权限的保护（检查用户是否拥有指定 permission code）
withPermission('admin:users:read', handler)
```

### 注册来源追踪

- `registration_source` 字段记录用户首次注册的来源（`'jwt'` 或 `'clerk'`）
- 后续关联账号不改变此字段
- admin 接口支持按 `registration_source` 过滤

### admin 用户的创建方式

通过种子脚本（`src/server/db/seed.ts`）初始化：
1. 创建默认角色和权限
2. 根据 `ADMIN_EMAILS` 环境变量创建初始管理员并分配 admin 角色

```
ADMIN_EMAILS="admin@example.com,owner@example.com"
```

---

## 会话管理设计

### Session 生命周期

```
登录 → 创建 session（login_at = NOW()）
  ↓
使用中 → 心跳更新（last_active_at = NOW()，每 2 分钟）
  ↓
登出 → 关闭 session（logout_at = NOW()，duration = logout_at - login_at）
     → 累加 duration 到 users.total_online_time
```

### 在线状态判断

```sql
-- 在线：未登出 且 最后活跃在 5 分钟内
SELECT * FROM user_sessions
WHERE logout_at IS NULL
  AND last_active_at > NOW() - INTERVAL '5 minutes';
```

### 异常处理

- 客户端崩溃未登出 → 超过 5 分钟无心跳视为离线
- 可选：定期清理任务，将超时 session 标记为已登出并计算 duration

---

## 不修改的文件

以下文件保持不动，Clerk 功能完整保留：
- `src/components/layout/providers.tsx`（ClerkProvider）
- `src/components/layout/app-sidebar.tsx`（useUser, SignOutButton）
- `src/components/layout/user-nav.tsx`（useUser）
- `src/components/org-switcher.tsx`（useOrganizationList）
- `src/hooks/use-nav.ts`（RBAC 过滤）
- `src/features/auth/components/sign-in-view.tsx`（Clerk 登录表单）
- `src/features/auth/components/sign-up-view.tsx`（Clerk 注册表单）
- 所有 dashboard 页面的 Clerk 组件

---

## 新增文件清单

| 文件路径 | 用途 |
|----------|------|
| `drizzle.config.ts` | Drizzle ORM 配置 |
| `src/server/db/index.ts` | 数据库连接 |
| `src/server/db/schema.ts` | 表定义（9 张表：users, roles, permissions, role_permissions, user_roles, email_verification_codes, refresh_tokens, user_sessions, sync_data） |
| `src/server/db/seed.ts` | 种子数据（角色、权限、管理员） |
| `src/server/auth/jwt.ts` | JWT 签发/验证 |
| `src/server/auth/password.ts` | 密码哈希/验证 |
| `src/server/auth/middleware.ts` | withJwtAuth() + withPermission() 路由保护 |
| `src/server/auth/verification.ts` | 验证码生成、校验、发送逻辑 |
| `src/server/auth/clerk-sync.ts` | Clerk 用户同步到本地 DB |
| `src/server/auth/validation/schemas.ts` | Zod 校验 schema |
| `src/server/email/resend.ts` | Resend 客户端初始化 |
| `src/server/email/templates.ts` | 邮件模板（验证码邮件） |
| `src/server/api-response.ts` | 统一 API 响应工具函数 |
| `src/server/repositories/user-repository.ts` | 用户 CRUD + RBAC 查询 |
| `src/app/api/auth/send-code/route.ts` | 发送验证码 API |
| `src/app/api/auth/register/route.ts` | 注册 API（验证码 + 密码） |
| `src/app/api/auth/login/route.ts` | 登录 API |
| `src/app/api/auth/logout/route.ts` | 登出 API |
| `src/app/api/auth/refresh/route.ts` | 刷新 Token API |
| `src/app/api/auth/me/route.ts` | 获取当前用户 API |
| `src/app/api/sessions/route.ts` | 获取用户会话列表 API |
| `src/app/api/sessions/heartbeat/route.ts` | 心跳更新 API |
| `src/app/api/sync/upload/route.ts` | 上传加密数据 API |
| `src/app/api/sync/download/route.ts` | 下载加密数据 API |
| `src/app/api/users/stats/route.ts` | 用户统计 API |
| `src/app/api/admin/users/route.ts` | 管理员：查看所有用户 API |
| `src/app/api/admin/users/[id]/route.ts` | 管理员：查看单用户详情 API |

## 修改文件清单

| 文件路径 | 修改内容 |
|----------|----------|
| `src/proxy.ts` | `auth.protect()` 只对 `/dashboard` 生效，放行 `/api` |
| `src/app/page.tsx` | 添加 Clerk 用户同步调用 |
| `src/app/dashboard/page.tsx` | 添加 Clerk 用户同步调用 |
| `.env.local` | 追加 DATABASE_URL, JWT secrets, RESEND_API_KEY, ADMIN_EMAILS |
| `package.json` | 新增依赖 + db:seed 脚本 |

---

## 验证方案

### 注册流程测试（邮箱验证）
```bash
# Step 1: 发送验证码
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
# → { "success": true, "message": "验证码已发送" }

# Step 2: 验证码 + 密码完成注册
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456","password":"Test1234"}'
# → { "success": true, "data": { "user": {...}, "access_token": "...", "refresh_token": "..." } }
```

### JWT 认证测试
```bash
# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","device_id":"macbook-001","device_name":"MacBook Pro","device_type":"macos"}'

# 访问受保护接口
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <access_token>"

# 查看会话列表
curl http://localhost:3000/api/sessions \
  -H "Authorization: Bearer <access_token>"

# 心跳
curl -X POST http://localhost:3000/api/sessions/heartbeat \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"session_id":"<session_id>"}'

# 登出
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<refresh_token>","session_id":"<session_id>"}'
```

### 管理员接口测试
```bash
# 查看所有用户（需要 admin 权限）
curl "http://localhost:3000/api/admin/users?page=1&limit=20&source=jwt" \
  -H "Authorization: Bearer <admin_access_token>"

# 按注册来源过滤
curl "http://localhost:3000/api/admin/users?source=clerk" \
  -H "Authorization: Bearer <admin_access_token>"

# 查看单个用户详情（含会话记录）
curl http://localhost:3000/api/admin/users/<user_id> \
  -H "Authorization: Bearer <admin_access_token>"
```

### Clerk 认证测试
1. 访问 `http://localhost:3000` → Clerk 登录
2. 进入 dashboard → 正常使用
3. 检查数据库 → 对应用户应有 `clerk_user_id`
4. 检查 user_sessions → 应有 auth_method = 'clerk' 的记录

### 账号关联测试
1. 用 `user@test.com` 通过 JWT 注册（先发验证码，再注册）
2. 用同一邮箱通过 Clerk 登录管理后台
3. 数据库中应该只有一条记录，同时有 `password_hash` 和 `clerk_user_id`
4. `registration_source` 应为 `'jwt'`（首次注册来源）

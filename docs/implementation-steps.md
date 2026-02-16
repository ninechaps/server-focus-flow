# 实施计划：双认证系统分步实现

> 每个 Step 都是独立可验证的，完成后可以运行对应的验证命令确认正确性。
> 依赖关系：Step 1 → Step 2 → Step 3 → ... 严格按顺序执行。
> 后端代码统一放在 `src/server/` 下，前端代码保持在 `src/lib/`、`src/features/`、`src/components/` 下。

---

## Step 1: 安装依赖 + 数据库连接 ✅

**目标**：项目能连接 PostgreSQL，Drizzle ORM 可用。

**操作**：
1. 安装依赖
   ```bash
   bun add drizzle-orm postgres argon2 jose resend
   bun add -D drizzle-kit dotenv
   ```
2. 创建 `drizzle.config.ts`
3. 创建 `src/server/db/index.ts` — postgres 连接 + drizzle 实例
4. 追加环境变量到 `.env.local`
   ```
   DATABASE_URL="postgresql://..."
   JWT_ACCESS_SECRET="..."
   JWT_REFRESH_SECRET="..."
   RESEND_API_KEY="..."
   ADMIN_EMAILS="admin@example.com"
   ```

**验证**：
```bash
bunx drizzle-kit check   # Drizzle 配置正确
bun run build            # 项目构建通过
```

**产出文件**：
- `drizzle.config.ts`（新增）
- `src/server/db/index.ts`（新增）
- `.env.local`（修改）
- `package.json`（修改）

---

## Step 2: 数据库 Schema + 迁移 ✅

**目标**：9 张表全部创建完毕，迁移成功。

**操作**：
1. 创建 `src/server/db/schema.ts` — 定义所有表（users, roles, permissions, role_permissions, user_roles, email_verification_codes, refresh_tokens, user_sessions, sync_data）
2. 生成并执行迁移

**验证**：
```bash
bunx drizzle-kit generate  # 生成迁移文件
bunx drizzle-kit migrate   # 执行迁移
bunx drizzle-kit studio    # 打开 Drizzle Studio 查看表结构
```

**产出文件**：
- `src/server/db/schema.ts`（新增）
- `drizzle/` 目录（迁移文件，自动生成）

---

## Step 3: 统一 API 响应 + Zod 校验 Schema ✅

**目标**：API 响应格式和输入校验工具就绪。

**操作**：
1. 创建 `src/server/api-response.ts` — `successResponse()`, `errorResponse()`
2. 创建 `src/server/auth/validation/schemas.ts` — `sendCodeSchema`, `registerSchema`, `loginSchema`, `refreshSchema`, `logoutSchema`

**验证**：
```bash
bun run build  # 编译通过，无类型错误
```

**产出文件**：
- `src/server/api-response.ts`（新增）
- `src/server/auth/validation/schemas.ts`（新增）

---

## Step 4: 密码工具 + JWT 工具

**目标**：密码哈希/验证、Token 签发/验证函数就绪。

**操作**：
1. 创建 `src/server/auth/password.ts` — `hashPassword()`, `verifyPassword()`
2. 创建 `src/server/auth/jwt.ts` — `signAccessToken()`, `signRefreshToken()`, `verifyAccessToken()`, `verifyRefreshToken()`
   - Access Token: 15 分钟，payload `{ sub, email, permissions }`
   - Refresh Token: 7 天

**验证**：
```bash
bun run build  # 编译通过
```

**产出文件**：
- `src/server/auth/password.ts`（新增）
- `src/server/auth/jwt.ts`（新增）

---

## Step 5: 用户 Repository

**目标**：用户 CRUD 数据库操作封装完成。

**操作**：
1. 创建 `src/server/repositories/user-repository.ts`
   - `findByEmail(email)` → User | null
   - `findById(id)` → User | null
   - `findByClerkId(clerkId)` → User | null
   - `create(data)` → User
   - `update(id, data)` → User
   - `updateLastLogin(id)` → void
   - `addOnlineTime(id, seconds)` → void
   - `linkClerkAccount(id, clerkUserId)` → User
   - `linkPassword(id, passwordHash)` → User
   - `getUserPermissions(userId)` → string[]（通过 user_roles → role_permissions → permissions 查询）
   - `assignRole(userId, roleName)` → void

**验证**：
```bash
bun run build  # 编译通过
```

**产出文件**：
- `src/server/repositories/user-repository.ts`（新增）

---

## Step 6: JWT 认证中间件

**目标**：API 路由保护中间件就绪。

**操作**：
1. 创建 `src/server/auth/middleware.ts`
   - `withJwtAuth(handler)` — 验证 Bearer token，注入 `userId`/`email`/`permissions` 到 handler
   - `withPermission(permission, handler)` — withJwtAuth + 检查用户是否拥有指定 permission
2. 修改 `src/proxy.ts` — `auth.protect()` 只对 `/dashboard` 路由生效，放行 `/api`

**验证**：
```bash
bun run build  # 编译通过
bun run dev    # 启动无报错，dashboard 仍需 Clerk 登录，/api 路由不被 Clerk 拦截
```

**产出文件**：
- `src/server/auth/middleware.ts`（新增）
- `src/proxy.ts`（修改）

---

## Step 7: 邮箱验证码服务

**目标**：能发送验证码邮件，能校验验证码。

**操作**：
1. 创建 `src/server/email/resend.ts` — Resend 客户端实例
2. 创建 `src/server/email/templates.ts` — 验证码邮件 HTML 模板
3. 创建 `src/server/auth/verification.ts`
   - `generateCode()` → 6 位数字
   - `sendVerificationCode(email)` → 生成 + 存库 + 发邮件（60 秒防刷）
   - `verifyCode(email, code)` → boolean（校验正确性/过期/尝试次数）

**验证**：
```bash
bun run build  # 编译通过
```

**产出文件**：
- `src/server/email/resend.ts`（新增）
- `src/server/email/templates.ts`（新增）
- `src/server/auth/verification.ts`（新增）

---

## Step 8: 注册流程 API（send-code + register）

**目标**：客户端可以完成 发送验证码 → 注册 的完整流程。

**操作**：
1. 创建 `src/app/api/auth/send-code/route.ts`
   - POST: 校验 email → 调用 sendVerificationCode → 返回成功
2. 创建 `src/app/api/auth/register/route.ts`
   - POST: 校验输入 → 验证码校验 → 创建/关联用户 → 分配默认角色（user）→ 创建 session → 签发 tokens

**验证**：
```bash
# 发送验证码
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
# → { "success": true }

# 注册（用收到的验证码）
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456","password":"Test1234"}'
# → { "success": true, "data": { "user": {...}, "access_token": "...", "refresh_token": "..." } }

# 检查数据库：users 表有新记录，user_roles 表有 user 角色关联
```

**产出文件**：
- `src/app/api/auth/send-code/route.ts`（新增）
- `src/app/api/auth/register/route.ts`（新增）

---

## Step 9: 登录 + 登出 API

**目标**：已注册用户可以登录/登出，session 被正确记录。

**操作**：
1. 创建 `src/app/api/auth/login/route.ts`
   - POST: 校验密码 → 检查邮箱已验证 → 创建 session → 签发 tokens → 返回 session_id
2. 创建 `src/app/api/auth/logout/route.ts`
   - POST: 撤销 refresh_token → 关闭 session（计算 duration）→ 累加 total_online_time

**验证**：
```bash
# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","device_id":"macbook-001","device_name":"MacBook Pro","device_type":"macos"}'
# → { "success": true, "data": { "user": {...}, "access_token": "...", "refresh_token": "...", "session_id": "..." } }

# 登出
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"...","session_id":"..."}'
# → { "success": true }

# 检查数据库：user_sessions 有记录，logout_at 非空，duration 已计算
```

**产出文件**：
- `src/app/api/auth/login/route.ts`（新增）
- `src/app/api/auth/logout/route.ts`（新增）

---

## Step 10: Token 刷新 + 获取用户信息 API

**目标**：客户端可以刷新过期 token，可以获取当前登录用户信息。

**操作**：
1. 创建 `src/app/api/auth/refresh/route.ts`
   - POST: 验证旧 refresh_token → 撤销旧 token → 签发新 token 对
2. 创建 `src/app/api/auth/me/route.ts`
   - GET: withJwtAuth 保护 → 返回当前用户信息（含角色和权限）

**验证**：
```bash
# 刷新 token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<old_refresh_token>"}'
# → { "success": true, "data": { "access_token": "...", "refresh_token": "..." } }

# 旧 refresh_token 再次使用应该失败
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<old_refresh_token>"}'
# → { "success": false, "error": "Token has been revoked" }

# 获取当前用户
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <new_access_token>"
# → { "success": true, "data": { "user": { "id": "...", "email": "...", "roles": ["user"], "permissions": [...], ... } } }

# 无 token 访问应该 401
curl http://localhost:3000/api/auth/me
# → { "success": false, "error": "Unauthorized" }
```

**产出文件**：
- `src/app/api/auth/refresh/route.ts`（新增）
- `src/app/api/auth/me/route.ts`（新增）

---

## Step 11: 会话管理 API（列表 + 心跳）

**目标**：客户端可以查看所有登录设备，保持在线心跳。

**操作**：
1. 创建 `src/app/api/sessions/route.ts`
   - GET: withJwtAuth 保护 → 返回当前用户所有 session（含 is_online 计算）
2. 创建 `src/app/api/sessions/heartbeat/route.ts`
   - POST: withJwtAuth 保护 → 更新 session.last_active_at

**验证**：
```bash
# 查看会话
curl http://localhost:3000/api/sessions \
  -H "Authorization: Bearer <access_token>"
# → { "success": true, "data": { "sessions": [{ "device_name": "MacBook Pro", "is_online": true, ... }] } }

# 心跳
curl -X POST http://localhost:3000/api/sessions/heartbeat \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"session_id":"<session_id>"}'
# → { "success": true }
```

**产出文件**：
- `src/app/api/sessions/route.ts`（新增）
- `src/app/api/sessions/heartbeat/route.ts`（新增）

---

## Step 12: 数据同步 API（上传 + 下载）

**目标**：客户端可以上传/下载加密数据块。

**操作**：
1. 创建 `src/app/api/sync/upload/route.ts`
   - POST: withJwtAuth 保护 → 存储 encrypted_data
2. 创建 `src/app/api/sync/download/route.ts`
   - GET: withJwtAuth 保护 → 返回最新加密数据

**验证**：
```bash
# 上传
curl -X POST http://localhost:3000/api/sync/upload \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"encrypted_data":"base64...","data_hash":"sha256hash","device_id":"macbook-001"}'
# → { "success": true, "data": { "id": "...", "synced_at": "..." } }

# 下载
curl "http://localhost:3000/api/sync/download?device_id=macbook-001" \
  -H "Authorization: Bearer <access_token>"
# → { "success": true, "data": { "encrypted_data": "base64...", "data_hash": "...", "synced_at": "..." } }
```

**产出文件**：
- `src/app/api/sync/upload/route.ts`（新增）
- `src/app/api/sync/download/route.ts`（新增）

---

## Step 13: 用户统计 API

**目标**：客户端可以获取/更新在线时长统计。

**操作**：
1. 创建 `src/app/api/users/stats/route.ts`
   - GET: withJwtAuth 保护 → 返回 total_online_time, last_login_at
   - POST: withJwtAuth 保护 → 累加 online_time

**验证**：
```bash
# 获取统计
curl http://localhost:3000/api/users/stats \
  -H "Authorization: Bearer <access_token>"
# → { "success": true, "data": { "total_online_time": 3600, "last_login_at": "..." } }

# 更新在线时长
curl -X POST http://localhost:3000/api/users/stats \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"online_time":120}'
# → { "success": true, "data": { "total_online_time": 3720 } }
```

**产出文件**：
- `src/app/api/users/stats/route.ts`（新增）

---

## Step 14: 管理员 API（用户列表 + 用户详情）

**目标**：拥有 `admin:users:read` 权限的用户可以查看所有用户，按注册来源过滤。

**操作**：
1. 创建 `src/app/api/admin/users/route.ts`
   - GET: `withPermission('admin:users:read')` 保护 → 分页查询 + 按 source/search 过滤
2. 创建 `src/app/api/admin/users/[id]/route.ts`
   - GET: `withPermission('admin:users:read')` 保护 → 用户详情 + 最近 session 记录

**验证**：
```bash
# 先通过种子脚本创建 admin 角色 + 权限 + 管理员用户
# 然后用 admin 用户登录获取 token

# 查看所有用户
curl "http://localhost:3000/api/admin/users?page=1&limit=20" \
  -H "Authorization: Bearer <admin_token>"
# → { "success": true, "data": { "users": [...], "meta": { "total": 1, "page": 1, "limit": 20 } } }

# 按注册来源过滤
curl "http://localhost:3000/api/admin/users?source=jwt" \
  -H "Authorization: Bearer <admin_token>"

# 查看单个用户
curl http://localhost:3000/api/admin/users/<user_id> \
  -H "Authorization: Bearer <admin_token>"
# → { "success": true, "data": { "user": {...}, "recent_sessions": [...] } }

# 无权限用户访问应该 403
curl "http://localhost:3000/api/admin/users" \
  -H "Authorization: Bearer <normal_user_token>"
# → { "success": false, "error": "Forbidden" }
```

**产出文件**：
- `src/app/api/admin/users/route.ts`（新增）
- `src/app/api/admin/users/[id]/route.ts`（新增）

---

## Step 15: RBAC 种子数据

**目标**：初始化默认角色、权限和管理员用户。

**操作**：
1. 创建 `src/server/db/seed.ts` — 种子脚本
   - 创建角色：`admin`, `user`
   - 创建权限：`admin:users:read`, `admin:users:write`, `sync:upload`, `sync:download`, `stats:read`, `stats:write`
   - 为 `admin` 角色分配所有权限
   - 为 `user` 角色分配 `sync:upload`, `sync:download`, `stats:read`, `stats:write`
   - 根据 `ADMIN_EMAILS` 环境变量创建初始管理员
2. 在 `package.json` 添加 `"db:seed": "bun src/server/db/seed.ts"` 脚本

**验证**：
```bash
bun run db:seed
# 检查数据库：roles 表有 2 条，permissions 表有 6 条，role_permissions 正确关联
```

**产出文件**：
- `src/server/db/seed.ts`（新增）
- `package.json`（修改）

---

## Step 16: Clerk 用户同步

**目标**：Clerk 登录管理后台时自动同步用户到本地 DB，创建 session 记录。

**操作**：
1. 创建 `src/server/auth/clerk-sync.ts`
   - `syncClerkUser(clerkUser)` → 查找/创建本地用户 + 分配默认角色 + 创建 session
   - 按 clerkId 查找 → 按 email 查找（关联）→ 不存在则创建
2. 修改 `src/app/page.tsx` — 已登录用户调用 syncClerkUser
3. 修改 `src/app/dashboard/page.tsx` — 同上

**验证**：
1. 通过 Clerk 登录 → 访问 dashboard
2. 查数据库 → users 表有对应记录，clerk_user_id 非空
3. user_roles 表有对应角色关联
4. user_sessions 表有 auth_method = 'clerk' 的记录
5. 用同一 email 的 JWT 用户登录 Clerk → 数据库只有一条 user 记录，同时有 password_hash 和 clerk_user_id

**产出文件**：
- `src/server/auth/clerk-sync.ts`（新增）
- `src/app/page.tsx`（修改）
- `src/app/dashboard/page.tsx`（修改）

---

## Step 17: 端到端集成验证

**目标**：所有功能协同工作，完整流程跑通。

**验证场景**：

### 场景 A：JWT 用户完整生命周期
```
1. POST /api/auth/send-code       → 收到验证码邮件
2. POST /api/auth/register        → 注册成功，拿到 tokens + session_id
3. GET  /api/auth/me              → 获取用户信息（含角色和权限）
4. POST /api/sessions/heartbeat   → 心跳成功
5. GET  /api/sessions             → 看到当前设备在线
6. POST /api/sync/upload          → 上传加密数据
7. GET  /api/sync/download        → 下载加密数据（一致）
8. POST /api/auth/refresh         → 刷新 token 成功
9. POST /api/auth/logout          → 登出成功
10. GET /api/auth/me              → 401（已登出）
```

### 场景 B：Clerk 用户 + 账号关联
```
1. Clerk 登录 dashboard           → 数据库创建用户（registration_source = 'clerk'）
2. 同一 email POST /api/auth/send-code → 发送验证码
3. POST /api/auth/register        → 关联账号（填充 password_hash，不改 registration_source）
4. 数据库只有一条记录             → 同时有 clerk_user_id 和 password_hash
```

### 场景 C：RBAC 权限控制
```
1. admin 用户登录获取 token
2. GET /api/admin/users           → 看到所有用户列表
3. GET /api/admin/users?source=jwt → 只看 JWT 注册用户
4. GET /api/admin/users/<id>      → 看到用户详情 + 会话历史
5. 普通 user 角色访问同一接口     → 403 Forbidden
```

---

## 总览：文件变更矩阵

| Step | 新增文件 | 修改文件 |
|------|---------|---------|
| 1 ✅ | `drizzle.config.ts`, `src/server/db/index.ts` | `.env.local`, `package.json` |
| 2 ✅ | `src/server/db/schema.ts` | — |
| 3 ✅ | `src/server/api-response.ts`, `src/server/auth/validation/schemas.ts` | — |
| 4 | `src/server/auth/password.ts`, `src/server/auth/jwt.ts` | — |
| 5 | `src/server/repositories/user-repository.ts` | — |
| 6 | `src/server/auth/middleware.ts` | `src/proxy.ts` |
| 7 | `src/server/email/resend.ts`, `src/server/email/templates.ts`, `src/server/auth/verification.ts` | — |
| 8 | `src/app/api/auth/send-code/route.ts`, `src/app/api/auth/register/route.ts` | — |
| 9 | `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts` | — |
| 10 | `src/app/api/auth/refresh/route.ts`, `src/app/api/auth/me/route.ts` | — |
| 11 | `src/app/api/sessions/route.ts`, `src/app/api/sessions/heartbeat/route.ts` | — |
| 12 | `src/app/api/sync/upload/route.ts`, `src/app/api/sync/download/route.ts` | — |
| 13 | `src/app/api/users/stats/route.ts` | — |
| 14 | `src/app/api/admin/users/route.ts`, `src/app/api/admin/users/[id]/route.ts` | — |
| 15 | `src/server/db/seed.ts` | `package.json` |
| 16 | `src/server/auth/clerk-sync.ts` | `src/app/page.tsx`, `src/app/dashboard/page.tsx` |
| 17 | — | — (纯验证) |

**总计**：新增 27 个文件，修改 5 个文件。

---

## 后端目录结构（最终）

```
src/server/
├── db/
│   ├── index.ts                  ← 数据库连接
│   ├── schema.ts                 ← 9 张表定义 + 关联 + 类型导出
│   └── seed.ts                   ← 种子数据（角色、权限、管理员）
├── auth/
│   ├── jwt.ts                    ← JWT 签发/验证
│   ├── password.ts               ← 密码哈希/验证
│   ├── middleware.ts             ← withJwtAuth() + withPermission()
│   ├── verification.ts           ← 邮箱验证码逻辑
│   ├── clerk-sync.ts             ← Clerk 用户同步
│   └── validation/
│       └── schemas.ts            ← Zod 校验 schema
├── email/
│   ├── resend.ts                 ← Resend 客户端
│   └── templates.ts              ← 邮件模板
├── repositories/
│   └── user-repository.ts        ← 用户 CRUD + RBAC 查询
└── api-response.ts               ← 统一 API 响应工具
```

# Docker 部署指南

## 环境要求

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 已安装并运行
- 项目根目录下存在 `.env.docker` 文件（已配置好，包含 JWT、RSA、邮件等密钥）

---

## 服务说明

| 服务 | 镜像 | 说明 |
|------|------|------|
| `db` | postgres:16-alpine | PostgreSQL 数据库 |
| `migrate` | 本地构建（migrator stage）| 执行数据库迁移 + 初始化 RBAC 数据，完成后自动退出 |
| `app` | 本地构建（runner stage）| Next.js 应用服务器 |

---

## 首次部署

### 第一步：构建并启动

```bash
docker compose up --build
```

启动顺序：

1. 启动 PostgreSQL，等待健康检查通过
2. `migrate` 容器执行数据库迁移（`drizzle-kit migrate`）+ 初始化角色权限数据（seed）
3. `migrate` 容器完成后退出
4. `app` 容器启动，Next.js 服务就绪

### 第二步：访问应用

浏览器打开：[http://localhost:3002](http://localhost:3002)

---

## 日常操作

### 后台运行

```bash
docker compose up -d --build
```

### 查看运行状态

```bash
docker compose ps
```

### 查看日志

```bash
# 查看所有服务日志
docker compose logs -f

# 只看 app 日志
docker compose logs app -f

# 查看迁移日志（排查初始化问题）
docker compose logs migrate
```

### 停止服务

```bash
# 停止但保留数据库数据
docker compose down

# 停止并删除数据库数据（重置为全新状态）
docker compose down -v
```

---

## 重新部署

### 代码有更新，重新构建

```bash
docker compose up --build
```

### 完全重置（清空数据库重来）

```bash
# 第一步：停止并删除旧数据
docker compose down -v

# 第二步：重新构建启动
docker compose up --build
```

---

## 端口说明

| 服务 | 容器内端口 | 本机访问端口 |
|------|-----------|-------------|
| Next.js 应用 | 3000 | **3002** |
| PostgreSQL | 5432 | 5433 |

> PostgreSQL 映射到本机 5433，避免与本机已有的 5432 冲突。

---

## 环境变量

应用所需的环境变量存放在 `.env.docker`（已由 `.gitignore` 保护，不会提交到 git）。

数据库连接地址由 `docker-compose.yml` 的 `environment` 直接注入，无需在 `.env.docker` 中配置 `DATABASE_URL`。

---

## 常见问题

### 启动报错：`relation already exists`

数据库 volume 中存在上次运行的脏数据，执行完全重置：

```bash
docker compose down -v
docker compose up --build
```

### 端口被占用

检查本机 3002 或 5433 端口是否被其他进程占用：

```bash
lsof -i :3002
lsof -i :5433
```

### 构建缓存问题

强制不使用缓存重新构建：

```bash
docker compose build --no-cache
docker compose up
```

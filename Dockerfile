# ══════════════════════════════════════════════════════════════════
# Stage 1: Install dependencies
# ══════════════════════════════════════════════════════════════════
FROM oven/bun:1-alpine AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ══════════════════════════════════════════════════════════════════
# Stage 2: Migrator — 运行 drizzle migrate + seed（不需要 Next.js 构建）
# drizzle-kit migrate 会写入 __drizzle_migrations 追踪表，
# 使 app 启动时的 instrumentation.ts 能识别"已完成"并跳过。
# ══════════════════════════════════════════════════════════════════
FROM oven/bun:1-alpine AS migrator
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY drizzle.config.ts ./
COPY drizzle ./drizzle
COPY src/server ./src/server

CMD ["sh", "-c", "bunx drizzle-kit migrate && bun run db:seed"]

# ══════════════════════════════════════════════════════════════════
# Stage 3: Builder — Next.js production build
# ══════════════════════════════════════════════════════════════════
FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 禁用 Sentry 和遥测，避免构建时需要 Sentry token
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SENTRY_DISABLED=true

# build 阶段提供占位 DATABASE_URL，避免模块初始化时因缺少变量报错。
# Next.js 静态分析 API 路由时会触发 db/index.ts 的模块求值，
# 但 build 期间不会真正建立数据库连接，所以假 URL 完全安全。
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build

RUN bun run build

# ══════════════════════════════════════════════════════════════════
# Stage 4: Runner — 最小化生产运行时
# ══════════════════════════════════════════════════════════════════
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# 从 builder 复制 standalone 产物
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# 显式复制迁移 SQL 文件（instrumentation.ts 启动时 runMigrations() 需要读取）
COPY --from=builder /app/drizzle ./drizzle

EXPOSE 3000

CMD ["bun", "server.js"]

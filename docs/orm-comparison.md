# ORM 对比示例

以本项目 `users` 表为例，展示 Drizzle / Prisma / Kysely 在各环节的写法差异。

---

## 1. Schema 定义

### Drizzle — TypeScript 代码定义

```typescript
// src/lib/db/schema.ts
import { pgTable, uuid, varchar, text, timestamp, integer } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 100 }).unique(),
  fullName: varchar('full_name', { length: 255 }),
  passwordHash: text('password_hash'),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).unique(),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  registrationSource: varchar('registration_source', { length: 20 }).notNull(),
  emailVerifiedAt: timestamp('email_verified_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastLoginAt: timestamp('last_login_at'),
  totalOnlineTime: integer('total_online_time').default(0),
})

// 类型推断
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

### Prisma — 独立 .prisma 文件

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                 String    @id @default(uuid())
  email              String    @unique @db.VarChar(255)
  username           String?   @unique @db.VarChar(100)
  fullName           String?   @map("full_name") @db.VarChar(255)
  passwordHash       String?   @map("password_hash")
  clerkUserId        String?   @unique @map("clerk_user_id") @db.VarChar(255)
  role               String    @default("user") @db.VarChar(20)
  registrationSource String    @map("registration_source") @db.VarChar(20)
  emailVerifiedAt    DateTime? @map("email_verified_at")
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")
  lastLoginAt        DateTime? @map("last_login_at")
  totalOnlineTime    Int       @default(0) @map("total_online_time")

  refreshTokens RefreshToken[]
  sessions      UserSession[]

  @@map("users")
}
```

### Kysely — 纯类型定义（表由迁移 SQL 手动创建）

```typescript
// src/lib/db/types.ts
import type { Generated, ColumnType } from 'kysely'

interface UsersTable {
  id: Generated<string>
  email: string
  username: string | null
  full_name: string | null
  password_hash: string | null
  clerk_user_id: string | null
  role: Generated<string>
  registration_source: string
  email_verified_at: Date | null
  created_at: Generated<Date>
  updated_at: Generated<Date>
  last_login_at: Date | null
  total_online_time: Generated<number>
}

interface Database {
  users: UsersTable
  refresh_tokens: RefreshTokensTable
  user_sessions: UserSessionsTable
  // ...
}
```

---

## 2. 数据库连接

### Drizzle

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client, { schema })
```

### Prisma

```typescript
import { PrismaClient } from '@prisma/client'

export const db = new PrismaClient()
```

### Kysely

```typescript
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { Database } from './types'

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: process.env.DATABASE_URL }),
  }),
})
```

---

## 3. 迁移

### Drizzle — 内置 drizzle-kit

```bash
bunx drizzle-kit generate   # 从 schema.ts 自动生成 SQL 迁移文件
bunx drizzle-kit migrate    # 执行迁移
bunx drizzle-kit studio     # 可视化查看数据
```

### Prisma — 内置 prisma migrate

```bash
bunx prisma migrate dev --name init   # 生成 + 执行迁移
bunx prisma generate                  # 生成客户端类型
bunx prisma studio                    # 可视化查看数据
```

### Kysely — 无内置，需手写 SQL 或搭配工具

```typescript
// migrations/001_create_users.ts
import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('email', 'varchar(255)', (col) => col.unique().notNull())
    .addColumn('username', 'varchar(100)', (col) => col.unique())
    .addColumn('full_name', 'varchar(255)')
    .addColumn('password_hash', 'text')
    .addColumn('clerk_user_id', 'varchar(255)', (col) => col.unique())
    .addColumn('role', 'varchar(20)', (col) => col.notNull().defaultTo('user'))
    .addColumn('registration_source', 'varchar(20)', (col) => col.notNull())
    .addColumn('email_verified_at', 'timestamp')
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamp', (col) => col.defaultTo(sql`NOW()`))
    .addColumn('last_login_at', 'timestamp')
    .addColumn('total_online_time', 'integer', (col) => col.defaultTo(0))
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('users').execute()
}
```

---

## 4. CRUD 操作对比

### 4.1 创建用户

```typescript
// ============ Drizzle ============
const newUser = await db.insert(users).values({
  email: 'user@test.com',
  registrationSource: 'jwt',
  passwordHash: hashedPassword,
}).returning()

// ============ Prisma ============
const newUser = await db.user.create({
  data: {
    email: 'user@test.com',
    registrationSource: 'jwt',
    passwordHash: hashedPassword,
  },
})

// ============ Kysely ============
const newUser = await db
  .insertInto('users')
  .values({
    email: 'user@test.com',
    registration_source: 'jwt',
    password_hash: hashedPassword,
  })
  .returningAll()
  .executeTakeFirstOrThrow()
```

### 4.2 按 email 查找

```typescript
// ============ Drizzle ============
const user = await db.query.users.findFirst({
  where: eq(users.email, 'user@test.com'),
})

// ============ Prisma ============
const user = await db.user.findUnique({
  where: { email: 'user@test.com' },
})

// ============ Kysely ============
const user = await db
  .selectFrom('users')
  .selectAll()
  .where('email', '=', 'user@test.com')
  .executeTakeFirst()
```

### 4.3 更新字段

```typescript
// ============ Drizzle ============
const updated = await db
  .update(users)
  .set({
    clerkUserId: 'clerk_xxx',
    updatedAt: new Date(),
  })
  .where(eq(users.id, userId))
  .returning()

// ============ Prisma ============
const updated = await db.user.update({
  where: { id: userId },
  data: {
    clerkUserId: 'clerk_xxx',
    // updatedAt 自动更新（@updatedAt）
  },
})

// ============ Kysely ============
const updated = await db
  .updateTable('users')
  .set({
    clerk_user_id: 'clerk_xxx',
    updated_at: new Date(),
  })
  .where('id', '=', userId)
  .returningAll()
  .executeTakeFirstOrThrow()
```

### 4.4 累加在线时长

```typescript
// ============ Drizzle ============
await db
  .update(users)
  .set({
    totalOnlineTime: sql`${users.totalOnlineTime} + ${seconds}`,
  })
  .where(eq(users.id, userId))

// ============ Prisma ============
await db.user.update({
  where: { id: userId },
  data: {
    totalOnlineTime: { increment: seconds },
  },
})

// ============ Kysely ============
await db
  .updateTable('users')
  .set((eb) => ({
    total_online_time: eb('total_online_time', '+', seconds),
  }))
  .where('id', '=', userId)
  .execute()
```

### 4.5 分页查询 + 过滤（admin 用户列表）

```typescript
// ============ Drizzle ============
const result = await db.query.users.findMany({
  where: and(
    source ? eq(users.registrationSource, source) : undefined,
    search ? or(
      ilike(users.email, `%${search}%`),
      ilike(users.username, `%${search}%`),
    ) : undefined,
  ),
  limit: 20,
  offset: (page - 1) * 20,
  orderBy: desc(users.createdAt),
})

// ============ Prisma ============
const result = await db.user.findMany({
  where: {
    ...(source && { registrationSource: source }),
    ...(search && {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ],
    }),
  },
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: 'desc' },
})

// ============ Kysely ============
let query = db.selectFrom('users').selectAll()

if (source) {
  query = query.where('registration_source', '=', source)
}
if (search) {
  query = query.where((eb) =>
    eb.or([
      eb('email', 'ilike', `%${search}%`),
      eb('username', 'ilike', `%${search}%`),
    ])
  )
}

const result = await query
  .orderBy('created_at', 'desc')
  .limit(20)
  .offset((page - 1) * 20)
  .execute()
```

### 4.6 关联查询（用户 + 最近会话）

```typescript
// ============ Drizzle ============
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    sessions: {
      orderBy: desc(userSessions.loginAt),
      limit: 10,
    },
  },
})

// ============ Prisma ============
const user = await db.user.findUnique({
  where: { id: userId },
  include: {
    sessions: {
      orderBy: { loginAt: 'desc' },
      take: 10,
    },
  },
})

// ============ Kysely ============
// Kysely 没有内置关联加载，需要分两次查询或用 JSON 聚合
const user = await db
  .selectFrom('users')
  .selectAll()
  .where('id', '=', userId)
  .executeTakeFirst()

const sessions = await db
  .selectFrom('user_sessions')
  .selectAll()
  .where('user_id', '=', userId)
  .orderBy('login_at', 'desc')
  .limit(10)
  .execute()
```

---

## 5. 总结

| 维度 | Drizzle | Prisma | Kysely |
|------|---------|--------|--------|
| Schema 写在哪 | `.ts` 文件 | `.prisma` 文件 | `.ts` 类型 + 手写迁移 |
| 字段命名 | camelCase（自动映射 snake_case） | camelCase（需 `@map`） | snake_case（跟数据库一致） |
| 关联查询 | `with` 语法，简洁 | `include` 语法，最强 | 手动多次查询 |
| 条件拼接 | `and()`/`or()` 函数式 | 对象嵌套 | 链式 `.where()` |
| 原生 SQL | `sql` 模板标签 | `$queryRaw` | `sql` 模板标签 |
| 迁移体验 | 自动 diff + 生成 | 自动 diff + 生成 | 手写 |
| 代码量 | 中等 | 最少 | 最多 |

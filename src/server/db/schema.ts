import { relations } from 'drizzle-orm'
import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

// ============================================================
// users: 统一用户表，JWT + Clerk 两套认证共用
// ============================================================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 100 }).unique(),
  fullName: varchar('full_name', { length: 255 }),
  passwordHash: text('password_hash'),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).unique(),
  avatarUrl: text('avatar_url'),
  registrationSource: varchar('registration_source', { length: 20 }).notNull(),
  emailVerifiedAt: timestamp('email_verified_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastLoginAt: timestamp('last_login_at'),
  totalOnlineTime: integer('total_online_time').default(0),
})

export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  sessions: many(userSessions),
  syncData: many(syncData),
  userRoles: many(userRoles),
}))

// ============================================================
// roles: 角色定义
// ============================================================
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).unique().notNull(),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
})

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}))

// ============================================================
// permissions: 权限定义
// ============================================================
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 100 }).unique().notNull(),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
})

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}))

// ============================================================
// role_permissions: 角色-权限关联（多对多）
// ============================================================
export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })]
)

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
  })
)

// ============================================================
// user_roles: 用户-角色关联（多对多）
// ============================================================
export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.roleId] })]
)

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}))

// ============================================================
// email_verification_codes: 邮箱验证码
// ============================================================
export const emailVerificationCodes = pgTable(
  'email_verification_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    code: varchar('code', { length: 6 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    attempts: integer('attempts').default(0),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [index('idx_email_verification_codes_email').on(table.email)]
)

// ============================================================
// refresh_tokens: JWT 刷新令牌
// ============================================================
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').unique().notNull(),
  deviceId: varchar('device_id', { length: 255 }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  revokedAt: timestamp('revoked_at'),
})

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}))

// ============================================================
// user_sessions: 用户登录会话记录
// ============================================================
export const userSessions = pgTable(
  'user_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    deviceId: varchar('device_id', { length: 255 }).notNull(),
    deviceName: varchar('device_name', { length: 255 }),
    deviceType: varchar('device_type', { length: 50 }),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    loginAt: timestamp('login_at').notNull().defaultNow(),
    lastActiveAt: timestamp('last_active_at').defaultNow(),
    logoutAt: timestamp('logout_at'),
    duration: integer('duration').default(0),
    authMethod: varchar('auth_method', { length: 20 }).notNull(),
  },
  (table) => [
    index('idx_user_sessions_user_id').on(table.userId),
    index('idx_user_sessions_device_id').on(table.deviceId),
  ]
)

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}))

// ============================================================
// sync_data: 客户端加密数据同步
// ============================================================
export const syncData = pgTable('sync_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  encryptedData: text('encrypted_data').notNull(),
  dataHash: varchar('data_hash', { length: 64 }).notNull(),
  deviceId: varchar('device_id', { length: 255 }).notNull(),
  syncedAt: timestamp('synced_at').defaultNow(),
})

export const syncDataRelations = relations(syncData, ({ one }) => ({
  user: one(users, {
    fields: [syncData.userId],
    references: [users.id],
  }),
}))

// ============================================================
// Type exports
// ============================================================
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert

export type Permission = typeof permissions.$inferSelect
export type NewPermission = typeof permissions.$inferInsert

export type UserRole = typeof userRoles.$inferSelect
export type NewUserRole = typeof userRoles.$inferInsert

export type RolePermission = typeof rolePermissions.$inferSelect
export type NewRolePermission = typeof rolePermissions.$inferInsert

export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect
export type NewEmailVerificationCode =
  typeof emailVerificationCodes.$inferInsert

export type RefreshToken = typeof refreshTokens.$inferSelect
export type NewRefreshToken = typeof refreshTokens.$inferInsert

export type UserSession = typeof userSessions.$inferSelect
export type NewUserSession = typeof userSessions.$inferInsert

export type SyncData = typeof syncData.$inferSelect
export type NewSyncData = typeof syncData.$inferInsert

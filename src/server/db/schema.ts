import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';

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
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  totalOnlineTime: integer('total_online_time').default(0),
  userType: varchar('user_type', { length: 20 }).notNull().default('client'),
  clientLoginEnabled: boolean('client_login_enabled').notNull().default(true)
});

export const usersRelations = relations(users, ({ many, one }) => ({
  refreshTokens: many(refreshTokens),
  sessions: many(userSessions),
  syncData: many(syncData),
  userRoles: many(userRoles),
  apiAccessLogs: many(apiAccessLogs),
  clientSettings: one(clientSettings, {
    fields: [users.id],
    references: [clientSettings.userId]
  })
}));

// ============================================================
// roles: 角色定义
// ============================================================
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).unique().notNull(),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions)
}));

// ============================================================
// permissions: 权限定义
// ============================================================
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 100 }).unique().notNull(),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions)
}));

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
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })]
);

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id]
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id]
    })
  })
);

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
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
  },
  (table) => [primaryKey({ columns: [table.userId, table.roleId] })]
);

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id]
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id]
  })
}));

// ============================================================
// email_verification_codes: 邮箱验证码
// ============================================================
export const emailVerificationCodes = pgTable(
  'email_verification_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    code: varchar('code', { length: 6 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    attempts: integer('attempts').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
  },
  (table) => [index('idx_email_verification_codes_email').on(table.email)]
);

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
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true })
});

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id]
  })
}));

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
    loginAt: timestamp('login_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastActiveAt: timestamp('last_active_at', {
      withTimezone: true
    }).defaultNow(),
    logoutAt: timestamp('logout_at', { withTimezone: true }),
    duration: integer('duration').default(0),
    authMethod: varchar('auth_method', { length: 20 }).notNull(),
    clientSource: varchar('client_source', { length: 50 })
      .notNull()
      .default('unknown')
  },
  (table) => [
    index('idx_user_sessions_user_id').on(table.userId),
    index('idx_user_sessions_device_id').on(table.deviceId)
  ]
);

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id]
  })
}));

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
  syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow()
});

export const syncDataRelations = relations(syncData, ({ one }) => ({
  user: one(users, {
    fields: [syncData.userId],
    references: [users.id]
  })
}));

// ============================================================
// api_access_logs: API 访问日志
// ============================================================
export const apiAccessLogs = pgTable(
  'api_access_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null'
    }),
    path: varchar('path', { length: 255 }).notNull(),
    method: varchar('method', { length: 10 }).notNull(),
    clientSource: varchar('client_source', { length: 50 })
      .notNull()
      .default('unknown'),
    statusCode: integer('status_code').notNull(),
    durationMs: integer('duration_ms').notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index('idx_api_access_logs_created_at').on(table.createdAt),
    index('idx_api_access_logs_user_id').on(table.userId),
    index('idx_api_access_logs_client_source').on(table.clientSource)
  ]
);

export const apiAccessLogsRelations = relations(apiAccessLogs, ({ one }) => ({
  user: one(users, {
    fields: [apiAccessLogs.userId],
    references: [users.id]
  })
}));

// ============================================================
// client_settings: macOS 客户端用户设置（每人一行，JSONB 存储）
// ============================================================
export const clientSettings = pgTable('client_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  // 设置内容：JSONB 格式，结构见下方 ClientSettingsData 类型
  settings: jsonb('settings').notNull().default({}),
  // 乐观锁版本号：客户端提交时需携带当前版本，服务端版本不一致时拒绝覆盖
  version: integer('version').notNull().default(1),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  // 客户端最后一次同步时间（由客户端拉取时更新）
  syncedAt: timestamp('synced_at', { withTimezone: true })
});

export const clientSettingsRelations = relations(clientSettings, ({ one }) => ({
  user: one(users, {
    fields: [clientSettings.userId],
    references: [users.id]
  })
}));

// ============================================================
// Type exports
// ============================================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;

export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect;
export type NewEmailVerificationCode =
  typeof emailVerificationCodes.$inferInsert;

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;

export type SyncData = typeof syncData.$inferSelect;
export type NewSyncData = typeof syncData.$inferInsert;

export type ApiAccessLog = typeof apiAccessLogs.$inferSelect;
export type NewApiAccessLog = typeof apiAccessLogs.$inferInsert;

export type ClientSettingsRow = typeof clientSettings.$inferSelect;
export type NewClientSettings = typeof clientSettings.$inferInsert;

/**
 * JSONB 字段 settings 的结构定义
 * 扩展设置时只需在这里添加字段，无需迁移数据库
 */
export interface ClientSettingsData {
  focus?: {
    defaultDuration?: number; // 专注时长（分钟），默认 25
    shortBreak?: number; // 短休息时长，默认 5
    longBreak?: number; // 长休息时长，默认 15
    cyclesBeforeLong?: number; // 几个专注后进入长休息，默认 4
    autoStartNext?: boolean; // 完成后自动开始下一个
  };
  notification?: {
    enabled?: boolean; // 是否开启通知
    sound?: boolean; // 是否有声音
    volume?: number; // 音量 0-1
  };
  appearance?: {
    theme?: 'light' | 'dark' | 'system';
    menuBarOnly?: boolean; // 仅在菜单栏显示，不在 Dock 显示
  };
  behavior?: {
    launchAtLogin?: boolean; // 登录时自动启动
    blockApps?: string[]; // 专注时屏蔽的应用 bundle ID 列表
  };
}

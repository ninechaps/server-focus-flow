import { config } from 'dotenv';
config({ path: '.env.local' });

import { eq } from 'drizzle-orm';
import { db } from './index';
import { roles, permissions, rolePermissions } from './schema';

// 曾经存在、现已废弃的角色，启动时自动清理
const DEPRECATED_ROLES = ['client_user'];

const ROLES = [
  { name: 'admin', description: 'Administrator with full access' },
  {
    name: 'user',
    description: 'FocusFlow client user — can sync data and read/write stats'
  }
];

const PERMISSIONS = [
  { code: 'admin:users:read', description: 'View all users' },
  { code: 'admin:users:write', description: 'Modify user information' },
  { code: 'sync:upload', description: 'Upload encrypted data' },
  { code: 'sync:download', description: 'Download encrypted data' },
  { code: 'stats:read', description: 'Read usage statistics' },
  { code: 'stats:write', description: 'Update usage statistics' }
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'admin:users:read',
    'admin:users:write',
    'sync:upload',
    'sync:download',
    'stats:read',
    'stats:write'
  ],
  user: ['sync:upload', 'sync:download', 'stats:read', 'stats:write']
};

/**
 * 幂等 seed：可安全重复执行，已存在的数据不会被覆盖。
 * 用于：bun run db:seed（CLI）和 instrumentation.ts（服务启动时自动执行）。
 */
export async function runSeed(): Promise<void> {
  // 清理废弃角色（级联删除 role_permissions 和 user_roles）
  for (const name of DEPRECATED_ROLES) {
    const deleted = await db
      .delete(roles)
      .where(eq(roles.name, name))
      .returning();
    if (deleted.length > 0) {
      console.log(`[seed] Removed deprecated role: ${name}`);
    }
  }

  console.log('[seed] Seeding roles...');
  for (const role of ROLES) {
    await db
      .insert(roles)
      .values(role)
      .onConflictDoUpdate({
        target: roles.name,
        set: { description: role.description }
      });
  }

  console.log('[seed] Seeding permissions...');
  for (const perm of PERMISSIONS) {
    await db
      .insert(permissions)
      .values(perm)
      .onConflictDoUpdate({
        target: permissions.code,
        set: { description: perm.description }
      });
  }

  console.log('[seed] Seeding role-permission associations...');
  const allRoles = await db.select().from(roles);
  const allPerms = await db.select().from(permissions);

  for (const [roleName, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = allRoles.find((r) => r.name === roleName);
    if (!role) continue;

    for (const code of permCodes) {
      const perm = allPerms.find((p) => p.code === code);
      if (!perm) continue;

      await db
        .insert(rolePermissions)
        .values({ roleId: role.id, permissionId: perm.id })
        .onConflictDoNothing();
    }
  }

  console.log('[seed] Completed.');
}

// CLI 入口：仅当作为脚本直接运行时执行（bun run db:seed）
// 当被 instrumentation.ts import 时，此判断为 false，不会自动执行
const isCli = process.argv[1]?.includes('seed');
if (isCli) {
  runSeed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('[seed] Failed:', error);
      process.exit(1);
    });
}

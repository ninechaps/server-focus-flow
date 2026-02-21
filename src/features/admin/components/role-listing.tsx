import { db } from '@/server/db';
import { roles, permissions, rolePermissions } from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getUserCountsForRoles } from '@/server/repositories/role-repository';
import { RoleTable } from './role-tables';
import type { AdminRole } from './role-tables/columns';

export default async function RoleListingPage() {
  const [roleRows, allPermissions, permissionRows, userCountMap] =
    await Promise.all([
      db.select().from(roles).orderBy(desc(roles.createdAt)),
      db
        .select({ id: permissions.id, code: permissions.code })
        .from(permissions),
      db
        .select({
          roleId: rolePermissions.roleId,
          code: permissions.code
        })
        .from(rolePermissions)
        .innerJoin(
          permissions,
          eq(rolePermissions.permissionId, permissions.id)
        ),
      getUserCountsForRoles()
    ]);

  const permMap = new Map<string, string[]>();
  for (const row of permissionRows) {
    const existing = permMap.get(row.roleId) ?? [];
    permMap.set(row.roleId, [...existing, row.code]);
  }

  const data: AdminRole[] = roleRows.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description ?? null,
    permissions: permMap.get(role.id) ?? [],
    userCount: userCountMap.get(role.id) ?? 0,
    createdAt: role.createdAt ?? null
  }));

  return (
    <RoleTable
      data={data}
      totalItems={data.length}
      allPermissions={allPermissions}
    />
  );
}

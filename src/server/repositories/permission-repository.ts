import { eq, desc, count } from 'drizzle-orm';
import { db } from '@/server/db';
import {
  permissions,
  rolePermissions,
  roles,
  type Permission
} from '@/server/db/schema';

export interface PermissionWithRoleCount extends Permission {
  roleCount: number;
}

export async function getAllPermissions(): Promise<PermissionWithRoleCount[]> {
  const rows = await db
    .select({
      id: permissions.id,
      code: permissions.code,
      description: permissions.description,
      createdAt: permissions.createdAt,
      roleCount: count(rolePermissions.roleId)
    })
    .from(permissions)
    .leftJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
    .groupBy(permissions.id)
    .orderBy(desc(permissions.createdAt));

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    description: row.description,
    createdAt: row.createdAt,
    roleCount: Number(row.roleCount)
  }));
}

export async function createPermission(
  code: string,
  description: string | undefined
): Promise<Permission> {
  const [permission] = await db
    .insert(permissions)
    .values({ code, description })
    .returning();
  return permission;
}

export async function updatePermission(
  id: string,
  code: string,
  description: string | undefined
): Promise<Permission> {
  const [permission] = await db
    .update(permissions)
    .set({ code, description })
    .where(eq(permissions.id, id))
    .returning();
  return permission;
}

export async function deletePermission(id: string): Promise<void> {
  await db.delete(permissions).where(eq(permissions.id, id));
}

export interface RoleForPermission {
  id: string;
  name: string;
  description: string | null;
}

export async function getRolesForPermission(
  permissionId: string
): Promise<RoleForPermission[]> {
  return db
    .select({
      id: roles.id,
      name: roles.name,
      description: roles.description
    })
    .from(rolePermissions)
    .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
    .where(eq(rolePermissions.permissionId, permissionId))
    .orderBy(roles.name);
}

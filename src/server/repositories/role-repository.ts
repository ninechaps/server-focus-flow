import { eq, desc, count } from 'drizzle-orm';
import { db } from '@/server/db';
import {
  roles,
  permissions,
  rolePermissions,
  userRoles,
  users,
  type Role
} from '@/server/db/schema';

export interface RoleWithPermissions extends Role {
  permissions: string[];
}

export async function getAllRoles(): Promise<RoleWithPermissions[]> {
  const roleRows = await db.select().from(roles).orderBy(desc(roles.createdAt));

  if (roleRows.length === 0) {
    return [];
  }

  const permissionRows = await db
    .select({
      roleId: rolePermissions.roleId,
      code: permissions.code
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id));

  const permMap = new Map<string, string[]>();
  for (const row of permissionRows) {
    const existing = permMap.get(row.roleId) ?? [];
    permMap.set(row.roleId, [...existing, row.code]);
  }

  return roleRows.map((role) => ({
    ...role,
    permissions: permMap.get(role.id) ?? []
  }));
}

export async function getRoleById(
  id: string
): Promise<RoleWithPermissions | null> {
  const role = await db.query.roles.findFirst({
    where: eq(roles.id, id)
  });

  if (!role) return null;

  const permissionRows = await db
    .select({ code: permissions.code })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, id));

  return {
    ...role,
    permissions: permissionRows.map((p) => p.code)
  };
}

export async function createRole(
  name: string,
  description: string | undefined,
  permissionCodes: string[]
): Promise<RoleWithPermissions> {
  const [role] = await db
    .insert(roles)
    .values({ name, description })
    .returning();

  if (permissionCodes.length > 0) {
    await attachPermissions(role.id, permissionCodes);
  }

  return { ...role, permissions: permissionCodes };
}

export async function updateRole(
  id: string,
  name: string,
  description: string | undefined,
  permissionCodes: string[]
): Promise<RoleWithPermissions> {
  const [role] = await db
    .update(roles)
    .set({ name, description })
    .where(eq(roles.id, id))
    .returning();

  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));

  if (permissionCodes.length > 0) {
    await attachPermissions(id, permissionCodes);
  }

  return { ...role, permissions: permissionCodes };
}

export async function deleteRole(id: string): Promise<void> {
  await db.delete(roles).where(eq(roles.id, id));
}

export interface UserForRole {
  id: string;
  email: string;
  username: string | null;
}

export async function getUsersForRole(roleId: string): Promise<UserForRole[]> {
  return db
    .select({
      id: users.id,
      email: users.email,
      username: users.username
    })
    .from(userRoles)
    .innerJoin(users, eq(userRoles.userId, users.id))
    .where(eq(userRoles.roleId, roleId))
    .orderBy(users.email);
}

export async function getUserCountsForRoles(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      roleId: userRoles.roleId,
      userCount: count(userRoles.userId)
    })
    .from(userRoles)
    .groupBy(userRoles.roleId);

  return new Map(rows.map((r) => [r.roleId, Number(r.userCount)]));
}

async function attachPermissions(
  roleId: string,
  permissionCodes: string[]
): Promise<void> {
  const permissionRows = await db
    .select({ id: permissions.id, code: permissions.code })
    .from(permissions);

  const codeToId = new Map(permissionRows.map((p) => [p.code, p.id]));

  const values = permissionCodes
    .map((code) => {
      const permId = codeToId.get(code);
      if (!permId) return null;
      return { roleId, permissionId: permId };
    })
    .filter((v): v is { roleId: string; permissionId: string } => v !== null);

  if (values.length > 0) {
    await db.insert(rolePermissions).values(values).onConflictDoNothing();
  }
}

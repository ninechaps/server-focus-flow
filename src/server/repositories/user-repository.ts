import { eq, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import {
  users,
  userRoles,
  rolePermissions,
  roles,
  permissions,
  type User,
  type NewUser
} from '@/server/db/schema';

export async function findByEmail(email: string): Promise<User | null> {
  const result = await db.query.users.findFirst({
    where: eq(users.email, email)
  });
  return result ?? null;
}

export async function findById(id: string): Promise<User | null> {
  const result = await db.query.users.findFirst({
    where: eq(users.id, id)
  });
  return result ?? null;
}

export async function findByClerkId(clerkId: string): Promise<User | null> {
  const result = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkId)
  });
  return result ?? null;
}

export async function create(data: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

export async function update(
  id: string,
  data: Partial<Omit<NewUser, 'id'>>
): Promise<User> {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user;
}

export async function updateLastLogin(id: string): Promise<void> {
  await db
    .update(users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, id));
}

export async function addOnlineTime(
  id: string,
  seconds: number
): Promise<void> {
  await db
    .update(users)
    .set({
      totalOnlineTime: sql`${users.totalOnlineTime} + ${seconds}`,
      updatedAt: new Date()
    })
    .where(eq(users.id, id));
}

export async function linkClerkAccount(
  id: string,
  clerkUserId: string
): Promise<User> {
  const [user] = await db
    .update(users)
    .set({ clerkUserId, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user;
}

export async function linkPassword(
  id: string,
  passwordHash: string
): Promise<User> {
  const [user] = await db
    .update(users)
    .set({
      passwordHash,
      emailVerifiedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(users.id, id))
    .returning();
  return user;
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const rows = await db
    .select({ code: permissions.code })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, userId));

  const codes = rows.map((row) => row.code);
  return Array.from(new Set(codes));
}

export async function getUserRoleNames(userId: string): Promise<string[]> {
  const rows = await db
    .select({ name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  return rows.map((row) => row.name);
}

export async function assignRole(
  userId: string,
  roleName: string
): Promise<void> {
  const role = await db.query.roles.findFirst({
    where: eq(roles.name, roleName)
  });

  if (!role) {
    throw new Error(`Role "${roleName}" not found`);
  }

  await db
    .insert(userRoles)
    .values({ userId, roleId: role.id })
    .onConflictDoNothing();
}

export async function setUserRoles(
  userId: string,
  roleIds: string[]
): Promise<void> {
  await db.delete(userRoles).where(eq(userRoles.userId, userId));

  if (roleIds.length > 0) {
    await db
      .insert(userRoles)
      .values(roleIds.map((roleId) => ({ userId, roleId })))
      .onConflictDoNothing();
  }
}

export async function getUserRolesWithIds(
  userId: string
): Promise<{ id: string; name: string }[]> {
  const rows = await db
    .select({ id: roles.id, name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  return rows;
}

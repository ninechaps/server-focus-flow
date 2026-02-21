import { db } from '@/server/db';
import { users, userRoles, roles } from '@/server/db/schema';
import { eq, ilike, or, count, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { searchParamsCache } from '@/lib/searchparams';
import { verifyAccessToken } from '@/server/auth/jwt';
import { getUserRoleNames } from '@/server/repositories/user-repository';
import { UserTable } from './user-tables';
import type { AdminUser } from './user-tables/columns';

async function getCurrentUserRoles(): Promise<string[]> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return [];
    const payload = await verifyAccessToken(token);
    if (!payload.sub) return [];
    return getUserRoleNames(payload.sub);
  } catch {
    return [];
  }
}

export default async function UserListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const search = searchParamsCache.get('email');
  const source = searchParamsCache.get('registrationSource');

  const offset = (page - 1) * pageLimit;

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(users.email, `%${search}%`),
        ilike(users.username, `%${search}%`)
      )!
    );
  }

  if (source) {
    const sources = source.split('.');
    if (sources.length === 1) {
      conditions.push(eq(users.registrationSource, sources[0]));
    }
  }

  const whereClause =
    conditions.length > 0
      ? conditions.reduce((acc, cond) => {
          if (!acc) return cond;
          return acc;
        })
      : undefined;

  const [userRows, totalResult, currentUserRoles] = await Promise.all([
    db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(pageLimit)
      .offset(offset),
    db.select({ count: count() }).from(users).where(whereClause),
    getCurrentUserRoles()
  ]);

  const userIds = userRows.map((u) => u.id);
  const userRolesMap = new Map<string, string[]>();

  if (userIds.length > 0) {
    const roleRows = await db
      .select({
        userId: userRoles.userId,
        roleName: roles.name
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id));

    for (const row of roleRows) {
      const existing = userRolesMap.get(row.userId) ?? [];
      userRolesMap.set(row.userId, [...existing, row.roleName]);
    }
  }

  const data: AdminUser[] = userRows.map((user) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    registrationSource: user.registrationSource,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    totalOnlineTime: user.totalOnlineTime,
    roles: userRolesMap.get(user.id) ?? []
  }));

  const totalUsers = totalResult[0]?.count ?? 0;
  const canAssignRoles =
    currentUserRoles.includes('admin') || currentUserRoles.includes('owner');

  return (
    <UserTable
      data={data}
      totalItems={totalUsers}
      canAssignRoles={canAssignRoles}
    />
  );
}

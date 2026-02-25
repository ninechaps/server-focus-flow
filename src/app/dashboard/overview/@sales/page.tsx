import { desc, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { users, userSessions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { RecentSales } from '@/features/overview/components/recent-sales';

export default async function Sales() {
  const rows = await db
    .select({
      userId: userSessions.userId,
      lastActiveAt: sql<string>`max(${userSessions.lastActiveAt})`,
      clientSource: sql<string>`(array_agg(${userSessions.clientSource} order by ${userSessions.lastActiveAt} desc))[1]`,
      email: users.email,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
      userType: users.userType
    })
    .from(userSessions)
    .innerJoin(users, eq(userSessions.userId, users.id))
    .groupBy(
      userSessions.userId,
      users.email,
      users.fullName,
      users.avatarUrl,
      users.userType
    )
    .orderBy(sql`max(${userSessions.lastActiveAt}) desc`)
    .limit(5);

  return <RecentSales users={rows} />;
}

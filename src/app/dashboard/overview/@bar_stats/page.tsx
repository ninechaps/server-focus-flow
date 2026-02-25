import { count, gte, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { userSessions } from '@/server/db/schema';
import { BarGraph } from '@/features/overview/components/bar-graph';

export default async function BarStats() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', ${userSessions.loginAt})::date::text`,
      clientSource: userSessions.clientSource,
      count: sql<number>`count(distinct ${userSessions.userId})`
    })
    .from(userSessions)
    .where(gte(userSessions.loginAt, thirtyDaysAgo))
    .groupBy(
      sql`date_trunc('day', ${userSessions.loginAt})`,
      userSessions.clientSource
    )
    .orderBy(sql`date_trunc('day', ${userSessions.loginAt})`);

  return <BarGraph data={rows} />;
}

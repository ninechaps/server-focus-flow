import { and, count, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { apiAccessLogs, userSessions } from '@/server/db/schema';
import { ClientSourceChart } from '@/features/overview/components/client-source-chart';

export default async function ClientStats() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const [dailyStats, macosActive, webActive] = await Promise.all([
    db
      .select({
        date: sql<string>`date_trunc('day', ${apiAccessLogs.createdAt})::date::text`,
        clientSource: apiAccessLogs.clientSource,
        count: count()
      })
      .from(apiAccessLogs)
      .where(gte(apiAccessLogs.createdAt, sevenDaysAgo))
      .groupBy(
        sql`date_trunc('day', ${apiAccessLogs.createdAt})`,
        apiAccessLogs.clientSource
      )
      .orderBy(sql`date_trunc('day', ${apiAccessLogs.createdAt})`),
    db
      .select({ count: count() })
      .from(userSessions)
      .where(
        and(
          eq(userSessions.clientSource, 'macos-app'),
          gte(userSessions.lastActiveAt, fiveMinutesAgo)
        )
      ),
    db
      .select({ count: count() })
      .from(userSessions)
      .where(
        and(
          eq(userSessions.clientSource, 'web-dashboard'),
          gte(userSessions.lastActiveAt, fiveMinutesAgo)
        )
      )
  ]);

  return (
    <ClientSourceChart
      dailyStats={dailyStats}
      activeClients={{
        macos: macosActive[0]?.count ?? 0,
        web: webActive[0]?.count ?? 0
      }}
    />
  );
}

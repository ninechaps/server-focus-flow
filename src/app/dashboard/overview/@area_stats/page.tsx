import { count, gte, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { AreaGraph } from '@/features/overview/components/area-graph';

export default async function AreaStats() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${users.createdAt}), 'YYYY-MM')`,
      label: sql<string>`to_char(date_trunc('month', ${users.createdAt}), 'Mon')`,
      count: count()
    })
    .from(users)
    .where(gte(users.createdAt, sixMonthsAgo))
    .groupBy(sql`date_trunc('month', ${users.createdAt})`)
    .orderBy(sql`date_trunc('month', ${users.createdAt})`);

  return <AreaGraph data={rows} />;
}

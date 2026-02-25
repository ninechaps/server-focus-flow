import { count, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { PieGraph } from '@/features/overview/components/pie-graph';

export default async function PieStats() {
  const rows = await db
    .select({
      source: users.registrationSource,
      count: count()
    })
    .from(users)
    .groupBy(users.registrationSource)
    .orderBy(sql`count(*) desc`);

  return <PieGraph data={rows} />;
}

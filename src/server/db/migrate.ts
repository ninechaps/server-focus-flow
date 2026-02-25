import path from 'path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './index';

/**
 * 运行所有待执行的 Drizzle 迁移。
 * 幂等操作：已执行的迁移会被跳过（drizzle 通过 __drizzle_migrations 表追踪）。
 */
export async function runMigrations(): Promise<void> {
  const migrationsFolder = path.join(process.cwd(), 'drizzle');
  console.log(`[migrate] Running migrations from: ${migrationsFolder}`);
  await migrate(db, { migrationsFolder });
  console.log('[migrate] All migrations applied.');
}

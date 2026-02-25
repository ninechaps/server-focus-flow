import * as Sentry from '@sentry/nextjs';

const sentryOptions: Sentry.NodeOptions | Sentry.EdgeOptions = {
  // Sentry DSN
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Enable Spotlight in development
  spotlight: process.env.NODE_ENV === 'development',

  // Adds request headers and IP for users, for more info visit
  sendDefaultPii: true,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false
};

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // DB 迁移 + Seed：仅在 Node.js 运行时执行，Edge runtime 没有文件系统访问权限
    // migrate() 幂等（通过 __drizzle_migrations 表跳过已执行的迁移）
    // runSeed() 幂等（onConflictDoNothing）
    if (process.env.DATABASE_URL) {
      try {
        const { runMigrations } = await import('@/server/db/migrate');
        await runMigrations();
      } catch (error) {
        console.error('[startup] Migration failed:', error);
        // 迁移失败时终止启动，避免在过期 schema 上运行
        process.exit(1);
      }

      try {
        const { runSeed } = await import('@/server/db/seed');
        await runSeed();
      } catch (error) {
        // Seed 失败不终止启动（基础数据已存在时可容忍轻微错误）
        console.error('[startup] Seed failed (non-fatal):', error);
      }
    }

    if (!process.env.NEXT_PUBLIC_SENTRY_DISABLED) {
      Sentry.init(sentryOptions);
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    if (!process.env.NEXT_PUBLIC_SENTRY_DISABLED) {
      Sentry.init(sentryOptions);
    }
  }
}

export const onRequestError = Sentry.captureRequestError;

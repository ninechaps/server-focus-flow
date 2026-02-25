import { NextRequest } from 'next/server';
import { and, count, eq, gte, sql } from 'drizzle-orm';
import { withAdminPermission } from '@/server/auth/middleware';
import { db } from '@/server/db';
import { apiAccessLogs, userSessions } from '@/server/db/schema';
import { successResponse, errorResponse } from '@/server/api-response';

export const GET = withAdminPermission(
  'admin:users:read',
  async (_req: NextRequest, _ctx) => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // 最近 7 天按日期+来源汇总的 API 调用数
      const dailyStats = await db
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
        .orderBy(sql`date_trunc('day', ${apiAccessLogs.createdAt})`);

      // 当前在线会话数按来源统计（最近 5 分钟活跃）
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const [macosActive, webActive] = await Promise.all([
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

      return successResponse({
        dailyStats,
        activeClients: {
          macos: macosActive[0]?.count ?? 0,
          web: webActive[0]?.count ?? 0
        }
      });
    } catch (error) {
      console.error('Admin stats error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
);

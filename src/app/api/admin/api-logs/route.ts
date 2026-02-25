import { NextRequest } from 'next/server';
import { and, desc, eq, gte, lte, count } from 'drizzle-orm';
import { withAdminPermission } from '@/server/auth/middleware';
import { db } from '@/server/db';
import { apiAccessLogs, users } from '@/server/db/schema';
import { successResponse, errorResponse } from '@/server/api-response';

export const GET = withAdminPermission(
  'admin:users:read',
  async (req, _ctx) => {
    try {
      const url = req.nextUrl;
      const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
      const pageLimit = Math.min(
        100,
        parseInt(url.searchParams.get('perPage') ?? '20')
      );
      const clientSource = url.searchParams.get('clientSource');
      const statusCode = url.searchParams.get('statusCode');
      const userId = url.searchParams.get('userId');
      const dateFrom = url.searchParams.get('dateFrom');
      const dateTo = url.searchParams.get('dateTo');

      const offset = (page - 1) * pageLimit;

      const conditions = [];

      if (clientSource) {
        conditions.push(eq(apiAccessLogs.clientSource, clientSource));
      }

      if (statusCode) {
        const code = parseInt(statusCode);
        if (!isNaN(code)) {
          conditions.push(eq(apiAccessLogs.statusCode, code));
        }
      }

      if (userId) {
        conditions.push(eq(apiAccessLogs.userId, userId));
      }

      if (dateFrom) {
        conditions.push(gte(apiAccessLogs.createdAt, new Date(dateFrom)));
      }

      if (dateTo) {
        conditions.push(lte(apiAccessLogs.createdAt, new Date(dateTo)));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [logs, totalResult] = await Promise.all([
        db
          .select({
            id: apiAccessLogs.id,
            path: apiAccessLogs.path,
            method: apiAccessLogs.method,
            clientSource: apiAccessLogs.clientSource,
            statusCode: apiAccessLogs.statusCode,
            durationMs: apiAccessLogs.durationMs,
            ipAddress: apiAccessLogs.ipAddress,
            createdAt: apiAccessLogs.createdAt,
            userId: apiAccessLogs.userId,
            userEmail: users.email
          })
          .from(apiAccessLogs)
          .leftJoin(users, eq(apiAccessLogs.userId, users.id))
          .where(whereClause)
          .orderBy(desc(apiAccessLogs.createdAt))
          .limit(pageLimit)
          .offset(offset),
        db.select({ count: count() }).from(apiAccessLogs).where(whereClause)
      ]);

      return successResponse({
        logs,
        total: totalResult[0]?.count ?? 0,
        page,
        perPage: pageLimit
      });
    } catch (error) {
      console.error('Admin api-logs error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
);

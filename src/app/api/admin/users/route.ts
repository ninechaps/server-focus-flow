import { eq, ilike, or, and, count, desc, type SQL } from 'drizzle-orm';
import { withAdminPermission } from '@/server/auth/middleware';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { sanitizeUser } from '@/server/auth/session';
import { successResponse, errorResponse } from '@/server/api-response';

export const GET = withAdminPermission(
  'admin:users:read',
  async (req, _ctx) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
      const limit = Math.min(
        100,
        Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10))
      );
      const source = searchParams.get('source');
      const search = searchParams.get('search');

      const conditions: SQL[] = [];

      if (source) {
        conditions.push(eq(users.registrationSource, source));
      }

      if (search) {
        conditions.push(
          or(
            ilike(users.email, `%${search}%`),
            ilike(users.username, `%${search}%`),
            ilike(users.fullName, `%${search}%`)
          )!
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const offset = (page - 1) * limit;

      const [userRows, countResult] = await Promise.all([
        db
          .select()
          .from(users)
          .where(where)
          .orderBy(desc(users.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(users).where(where)
      ]);

      const total = countResult[0]?.count ?? 0;

      return successResponse(
        { users: userRows.map(sanitizeUser) },
        { total, page, limit }
      );
    } catch (error) {
      console.error('Admin list users error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
);

import { NextRequest } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { withAdminPermission } from '@/server/auth/middleware';
import { db } from '@/server/db';
import { userSessions } from '@/server/db/schema';
import { successResponse, errorResponse } from '@/server/api-response';

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

export const GET = withAdminPermission(
  'admin:users:read',
  async (req: NextRequest, _ctx) => {
    try {
      const userId = req.nextUrl.pathname.split('/').pop();
      if (!userId) {
        return errorResponse('User ID is required', 400);
      }

      const sessions = await db
        .select()
        .from(userSessions)
        .where(eq(userSessions.userId, userId))
        .orderBy(desc(userSessions.loginAt));

      const now = Date.now();
      const result = sessions.map((s) => {
        const isOnline =
          !s.logoutAt &&
          s.lastActiveAt &&
          now - new Date(s.lastActiveAt).getTime() < ONLINE_THRESHOLD_MS;

        return {
          id: s.id,
          deviceId: s.deviceId,
          deviceName: s.deviceName,
          deviceType: s.deviceType,
          ipAddress: s.ipAddress,
          loginAt: s.loginAt,
          lastActiveAt: s.lastActiveAt,
          logoutAt: s.logoutAt,
          duration: s.duration,
          authMethod: s.authMethod,
          isOnline: !!isOnline
        };
      });

      return successResponse({ sessions: result });
    } catch (error) {
      console.error('Admin get user sessions error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
);

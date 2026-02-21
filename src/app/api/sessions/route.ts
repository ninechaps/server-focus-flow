import { eq, desc, isNull } from 'drizzle-orm';
import { withJwtAuth } from '@/server/auth/middleware';
import { db } from '@/server/db';
import { userSessions } from '@/server/db/schema';
import { successResponse, errorResponse } from '@/server/api-response';

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export const GET = withJwtAuth(async (_req, ctx) => {
  try {
    const sessions = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, ctx.userId))
      .orderBy(desc(userSessions.loginAt));

    const now = Date.now();
    const sessionsWithOnline = sessions.map((session) => {
      const isOnline =
        !session.logoutAt &&
        session.lastActiveAt &&
        now - new Date(session.lastActiveAt).getTime() < ONLINE_THRESHOLD_MS;

      return {
        id: session.id,
        deviceId: session.deviceId,
        deviceName: session.deviceName,
        deviceType: session.deviceType,
        ipAddress: session.ipAddress,
        loginAt: session.loginAt,
        lastActiveAt: session.lastActiveAt,
        logoutAt: session.logoutAt,
        duration: session.duration,
        authMethod: session.authMethod,
        isOnline: !!isOnline
      };
    });

    return successResponse({ sessions: sessionsWithOnline });
  } catch (error) {
    console.error('List sessions error:', error);
    return errorResponse('Internal server error', 500);
  }
});

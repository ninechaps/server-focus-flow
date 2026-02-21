import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { withJwtAuth } from '@/server/auth/middleware';
import { heartbeatSchema } from '@/server/auth/validation/schemas';
import { db } from '@/server/db';
import { userSessions } from '@/server/db/schema';
import { successResponse, errorResponse } from '@/server/api-response';

export const POST = withJwtAuth(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = heartbeatSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const { sessionId } = parsed.data;

    const session = await db.query.userSessions.findFirst({
      where: and(
        eq(userSessions.id, sessionId),
        eq(userSessions.userId, ctx.userId)
      )
    });

    if (!session) {
      return errorResponse('Session not found', 404);
    }

    if (session.logoutAt) {
      return errorResponse('Session already ended', 400);
    }

    await db
      .update(userSessions)
      .set({ lastActiveAt: new Date() })
      .where(eq(userSessions.id, sessionId));

    return successResponse({ message: 'Heartbeat recorded' });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return errorResponse('Internal server error', 500);
  }
});

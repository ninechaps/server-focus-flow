import { eq, and } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { withJwtAuth } from '@/server/auth/middleware';
import { db } from '@/server/db';
import { userSessions } from '@/server/db/schema';
import { successResponse, errorResponse } from '@/server/api-response';

export const DELETE = withJwtAuth(async (req: NextRequest, ctx) => {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) {
      return errorResponse('Session ID is required', 400);
    }

    const session = await db.query.userSessions.findFirst({
      where: and(eq(userSessions.id, id), eq(userSessions.userId, ctx.userId))
    });

    if (!session) {
      return errorResponse('Session not found', 404);
    }

    await db
      .update(userSessions)
      .set({ logoutAt: new Date() })
      .where(eq(userSessions.id, id));

    return successResponse({ message: 'Session logged out' });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
});

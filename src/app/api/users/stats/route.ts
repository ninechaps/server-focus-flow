import { NextRequest } from 'next/server';
import { withJwtAuth } from '@/server/auth/middleware';
import { statsUpdateSchema } from '@/server/auth/validation/schemas';
import * as userRepo from '@/server/repositories/user-repository';
import { successResponse, errorResponse } from '@/server/api-response';

export const GET = withJwtAuth(async (_req, ctx) => {
  try {
    const user = await userRepo.findById(ctx.userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse({
      totalOnlineTime: user.totalOnlineTime ?? 0,
      lastLoginAt: user.lastLoginAt
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return errorResponse('Internal server error', 500);
  }
});

export const POST = withJwtAuth(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = statsUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const { onlineTime } = parsed.data;

    await userRepo.addOnlineTime(ctx.userId, onlineTime);

    const user = await userRepo.findById(ctx.userId);

    return successResponse({
      totalOnlineTime: user?.totalOnlineTime ?? 0
    });
  } catch (error) {
    console.error('Update stats error:', error);
    return errorResponse('Internal server error', 500);
  }
});

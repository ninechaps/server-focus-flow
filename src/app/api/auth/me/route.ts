import { withJwtAuth } from '@/server/auth/middleware';
import * as userRepo from '@/server/repositories/user-repository';
import { sanitizeUser } from '@/server/auth/session';
import { successResponse, errorResponse } from '@/server/api-response';

export const GET = withJwtAuth(async (_req, ctx) => {
  try {
    const user = await userRepo.findById(ctx.userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    const roles = await userRepo.getUserRoleNames(ctx.userId);

    return successResponse({
      user: {
        ...sanitizeUser(user),
        roles,
        permissions: ctx.permissions
      }
    });
  } catch (error) {
    console.error('Get user info error:', error);
    return errorResponse('Internal server error', 500);
  }
});

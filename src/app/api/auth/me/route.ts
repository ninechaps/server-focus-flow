import { withJwtAuth } from '@/server/auth/middleware';
import * as userRepo from '@/server/repositories/user-repository';
import { sanitizeUser } from '@/server/auth/session';
import { successResponse, errorResponse } from '@/server/api-response';
import { updateProfileSchema } from '@/server/auth/validation/schemas';

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

export const PATCH = withJwtAuth(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    // username 唯一性校验
    if (parsed.data.username) {
      const existing = await userRepo.findByUsername(parsed.data.username);
      if (existing && existing.id !== ctx.userId) {
        return errorResponse('Username already taken', 409);
      }
    }

    const updated = await userRepo.update(ctx.userId, parsed.data);
    return successResponse({ user: sanitizeUser(updated) });
  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse('Internal server error', 500);
  }
});

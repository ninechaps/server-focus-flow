import { withJwtAuth } from '@/server/auth/middleware';
import * as userRepo from '@/server/repositories/user-repository';
import { sanitizeUser } from '@/server/auth/session';
import { successResponse, errorResponse } from '@/server/api-response';
import { updateAvatarSchema } from '@/server/auth/validation/schemas';

export const PATCH = withJwtAuth(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = updateAvatarSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const updated = await userRepo.update(ctx.userId, {
      avatarUrl: parsed.data.avatarUrl
    });

    return successResponse({ user: sanitizeUser(updated) });
  } catch (error) {
    console.error('Update avatar error:', error);
    return errorResponse('Internal server error', 500);
  }
});

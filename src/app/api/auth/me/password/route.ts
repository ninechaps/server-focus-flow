import { withJwtAuth } from '@/server/auth/middleware';
import * as userRepo from '@/server/repositories/user-repository';
import { verifyPassword, hashPassword } from '@/server/auth/password';
import { decryptPassword } from '@/server/auth/rsa';
import { successResponse, errorResponse } from '@/server/api-response';
import {
  changePasswordSchema,
  validatePasswordPolicy
} from '@/server/auth/validation/schemas';

export const PATCH = withJwtAuth(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const user = await userRepo.findById(ctx.userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    if (!user.passwordHash) {
      return errorResponse(
        'Password login is not enabled for this account',
        400
      );
    }

    let currentPassword: string;
    let newPassword: string;
    try {
      currentPassword = decryptPassword(parsed.data.currentEncryptedPassword);
      newPassword = decryptPassword(parsed.data.newEncryptedPassword);
    } catch {
      return errorResponse('Invalid encrypted password', 400);
    }

    const currentValid = await verifyPassword(
      user.passwordHash,
      currentPassword
    );
    if (!currentValid) {
      return errorResponse('Current password is incorrect', 401);
    }

    const policyError = validatePasswordPolicy(newPassword);
    if (policyError) {
      return errorResponse(policyError, 400);
    }

    if (currentPassword === newPassword) {
      return errorResponse(
        'New password must differ from current password',
        400
      );
    }

    const newHash = await hashPassword(newPassword);
    await userRepo.update(ctx.userId, { passwordHash: newHash });

    return successResponse({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse('Internal server error', 500);
  }
});

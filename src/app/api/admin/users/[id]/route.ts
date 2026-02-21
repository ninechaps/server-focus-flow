import { NextRequest } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { withAdminPermission } from '@/server/auth/middleware';
import { db } from '@/server/db';
import { userSessions } from '@/server/db/schema';
import * as userRepo from '@/server/repositories/user-repository';
import { sanitizeUser } from '@/server/auth/session';
import { successResponse, errorResponse } from '@/server/api-response';

export const GET = withAdminPermission(
  'admin:users:read',
  async (req, _ctx) => {
    try {
      const id = req.nextUrl.pathname.split('/').pop();
      if (!id) {
        return errorResponse('User ID is required', 400);
      }

      const user = await userRepo.findById(id);
      if (!user) {
        return errorResponse('User not found', 404);
      }

      const roles = await userRepo.getUserRoleNames(user.id);
      const permissions = await userRepo.getUserPermissions(user.id);

      const recentSessions = await db
        .select()
        .from(userSessions)
        .where(eq(userSessions.userId, user.id))
        .orderBy(desc(userSessions.loginAt))
        .limit(10);

      return successResponse({
        user: {
          ...sanitizeUser(user),
          roles,
          permissions
        },
        recentSessions: recentSessions.map((s) => ({
          id: s.id,
          deviceId: s.deviceId,
          deviceName: s.deviceName,
          deviceType: s.deviceType,
          ipAddress: s.ipAddress,
          loginAt: s.loginAt,
          lastActiveAt: s.lastActiveAt,
          logoutAt: s.logoutAt,
          duration: s.duration,
          authMethod: s.authMethod
        }))
      });
    } catch (error) {
      console.error('Admin get user detail error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
);

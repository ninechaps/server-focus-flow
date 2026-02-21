import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminPermission } from '@/server/auth/middleware';
import {
  getUserRolesWithIds,
  setUserRoles
} from '@/server/repositories/user-repository';
import { getAllRoles } from '@/server/repositories/role-repository';
import { successResponse, errorResponse } from '@/server/api-response';

const setRolesSchema = z.object({
  roleIds: z.array(z.string())
});

export const GET = withAdminPermission(
  'admin:users:read',
  async (req, _ctx) => {
    try {
      const id = req.nextUrl.pathname.split('/').at(-2);
      if (!id) return errorResponse('User ID required', 400);

      const [allRoles, userRoles] = await Promise.all([
        getAllRoles(),
        getUserRolesWithIds(id)
      ]);

      return successResponse({
        allRoles,
        userRoleIds: userRoles.map((r) => r.id)
      });
    } catch (error) {
      console.error('Get user roles error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
);

export const PUT = withAdminPermission(
  'admin:users:write',
  async (req: NextRequest, _ctx) => {
    try {
      const id = req.nextUrl.pathname.split('/').at(-2);
      if (!id) return errorResponse('User ID required', 400);

      const body = await req.json();
      const parsed = setRolesSchema.safeParse(body);
      if (!parsed.success) return errorResponse(parsed.error.message, 400);

      await setUserRoles(id, parsed.data.roleIds);
      return successResponse({ updated: true });
    } catch (error) {
      console.error('Set user roles error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
);

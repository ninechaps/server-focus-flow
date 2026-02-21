import { withAdminPermission } from '@/server/auth/middleware';
import { getUsersForRole } from '@/server/repositories/role-repository';
import { successResponse, errorResponse } from '@/server/api-response';

export const GET = withAdminPermission(
  'admin:users:read',
  async (req, _ctx) => {
    try {
      const segments = req.nextUrl.pathname.split('/');
      const id = segments.at(-2);
      if (!id) return errorResponse('Role ID required', 400);

      const users = await getUsersForRole(id);
      return successResponse({ users });
    } catch (error) {
      console.error('Get role users error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
);

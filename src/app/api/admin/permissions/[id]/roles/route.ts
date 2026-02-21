import { withAdminPermission } from '@/server/auth/middleware';
import { getRolesForPermission } from '@/server/repositories/permission-repository';
import { successResponse, errorResponse } from '@/server/api-response';

export const GET = withAdminPermission(
  'admin:users:read',
  async (req, _ctx) => {
    try {
      const segments = req.nextUrl.pathname.split('/');
      const id = segments.at(-2);
      if (!id) return errorResponse('Permission ID required', 400);

      const roles = await getRolesForPermission(id);
      return successResponse({ roles });
    } catch (error) {
      console.error('Get permission roles error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
);

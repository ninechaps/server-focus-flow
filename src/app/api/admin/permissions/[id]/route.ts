import { NextRequest } from 'next/server';
import { withAdminPermission } from '@/server/auth/middleware';
import * as permissionRepo from '@/server/repositories/permission-repository';
import { successResponse, errorResponse } from '@/server/api-response';
import { z } from 'zod';

const updatePermissionSchema = z.object({
  code: z.string().min(1).max(100),
  description: z.string().max(255).optional()
});

export const PUT = withAdminPermission(
  'admin:users:write',
  async (req: NextRequest, _ctx) => {
    try {
      const id = req.nextUrl.pathname.split('/').pop();
      if (!id) {
        return errorResponse('Permission ID is required', 400);
      }

      const body = await req.json();
      const parsed = updatePermissionSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse(parsed.error.message, 400);
      }

      const { code, description } = parsed.data;
      const permission = await permissionRepo.updatePermission(
        id,
        code,
        description
      );
      return successResponse({ permission });
    } catch (error) {
      console.error('Admin update permission error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
);

export const DELETE = withAdminPermission(
  'admin:users:write',
  async (req: NextRequest, _ctx) => {
    try {
      const id = req.nextUrl.pathname.split('/').pop();
      if (!id) {
        return errorResponse('Permission ID is required', 400);
      }

      await permissionRepo.deletePermission(id);
      return successResponse({ deleted: true });
    } catch (error) {
      console.error('Admin delete permission error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
);

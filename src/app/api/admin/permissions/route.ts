import { NextRequest } from 'next/server';
import { withAdminPermission } from '@/server/auth/middleware';
import * as permissionRepo from '@/server/repositories/permission-repository';
import { successResponse, errorResponse } from '@/server/api-response';
import { z } from 'zod';

const createPermissionSchema = z.object({
  code: z.string().min(1).max(100),
  description: z.string().max(255).optional()
});

export const GET = withAdminPermission(
  'admin:users:read',
  async (_req, _ctx) => {
    try {
      const perms = await permissionRepo.getAllPermissions();
      return successResponse({ permissions: perms });
    } catch (error) {
      console.error('Admin list permissions error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
);

export const POST = withAdminPermission(
  'admin:users:write',
  async (req: NextRequest, _ctx) => {
    try {
      const body = await req.json();
      const parsed = createPermissionSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse(parsed.error.message, 400);
      }

      const { code, description } = parsed.data;
      const permission = await permissionRepo.createPermission(
        code,
        description
      );
      return successResponse({ permission }, undefined, 201);
    } catch (error) {
      console.error('Admin create permission error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
);

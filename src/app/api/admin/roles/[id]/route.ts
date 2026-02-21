import { NextRequest } from 'next/server';
import { withAdminPermission } from '@/server/auth/middleware';
import * as roleRepo from '@/server/repositories/role-repository';
import { successResponse, errorResponse } from '@/server/api-response';
import { z } from 'zod';

const SYSTEM_ROLES = ['owner'];

const updateRoleSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(255).optional(),
  permissionCodes: z.array(z.string()).default([])
});

export const PUT = withAdminPermission(
  'admin:users:write',
  async (req: NextRequest, _ctx) => {
    try {
      const id = req.nextUrl.pathname.split('/').pop();
      if (!id) {
        return errorResponse('Role ID is required', 400);
      }

      const existing = await roleRepo.getRoleById(id);
      if (existing && SYSTEM_ROLES.includes(existing.name)) {
        return errorResponse('System roles cannot be modified', 403);
      }

      const body = await req.json();
      const parsed = updateRoleSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse(parsed.error.message, 400);
      }

      const { name, description, permissionCodes } = parsed.data;
      const role = await roleRepo.updateRole(
        id,
        name,
        description,
        permissionCodes
      );
      return successResponse({ role });
    } catch (error) {
      console.error('Admin update role error:', error);
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
        return errorResponse('Role ID is required', 400);
      }

      const existing = await roleRepo.getRoleById(id);
      if (existing && SYSTEM_ROLES.includes(existing.name)) {
        return errorResponse('System roles cannot be deleted', 403);
      }

      await roleRepo.deleteRole(id);
      return successResponse({ deleted: true });
    } catch (error) {
      console.error('Admin delete role error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
);

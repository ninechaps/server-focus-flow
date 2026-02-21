import { NextRequest } from 'next/server';
import { withAdminPermission } from '@/server/auth/middleware';
import * as roleRepo from '@/server/repositories/role-repository';
import { successResponse, errorResponse } from '@/server/api-response';
import { z } from 'zod';

const createRoleSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(255).optional(),
  permissionCodes: z.array(z.string()).default([])
});

export const GET = withAdminPermission(
  'admin:users:read',
  async (_req, _ctx) => {
    try {
      const roles = await roleRepo.getAllRoles();
      return successResponse({ roles });
    } catch (error) {
      console.error('Admin list roles error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
);

export const POST = withAdminPermission(
  'admin:users:write',
  async (req: NextRequest, _ctx) => {
    try {
      const body = await req.json();
      const parsed = createRoleSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse(parsed.error.message, 400);
      }

      const { name, description, permissionCodes } = parsed.data;
      const role = await roleRepo.createRole(
        name,
        description,
        permissionCodes
      );
      return successResponse({ role }, undefined, 201);
    } catch (error) {
      console.error('Admin create role error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
);

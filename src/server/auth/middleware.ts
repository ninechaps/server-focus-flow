import { type NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, type AccessTokenPayload } from './jwt';
import { errorResponse } from '@/server/api-response';
import { getUserPermissions } from '@/server/repositories/user-repository';

export interface AuthContext {
  userId: string;
  email: string;
  permissions: string[];
}

type AuthenticatedHandler = (
  req: NextRequest,
  ctx: AuthContext
) => Promise<NextResponse>;

function extractToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return req.cookies.get('access_token')?.value ?? null;
}

export function withJwtAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest) => {
    const token = extractToken(req);
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    let payload: AccessTokenPayload;
    try {
      payload = await verifyAccessToken(token);
    } catch {
      return errorResponse('Invalid or expired token', 401);
    }

    if (!payload.sub || !payload.email) {
      return errorResponse('Invalid token payload', 401);
    }

    const ctx: AuthContext = {
      userId: payload.sub,
      email: payload.email,
      permissions: payload.permissions ?? []
    };

    return handler(req, ctx);
  };
}

export function withPermission(
  requiredPermission: string,
  handler: AuthenticatedHandler
) {
  return withJwtAuth(async (req, ctx) => {
    if (!ctx.permissions.includes(requiredPermission)) {
      return errorResponse('Forbidden', 403);
    }
    return handler(req, ctx);
  });
}

/**
 * 实时从 DB 查询权限后校验，解决 JWT 权限快照过期问题。
 * 适用于所有 Admin API —— 权限变更后立即生效，无需重新登录。
 */
export function withAdminPermission(
  requiredPermission: string,
  handler: AuthenticatedHandler
) {
  return withJwtAuth(async (req, ctx) => {
    const dbPermissions = await getUserPermissions(ctx.userId);
    if (!dbPermissions.includes(requiredPermission)) {
      return errorResponse('Forbidden', 403);
    }
    return handler(req, { ...ctx, permissions: dbPermissions });
  });
}

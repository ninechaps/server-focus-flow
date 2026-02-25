import { type NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, type AccessTokenPayload } from './jwt';
import { errorResponse } from '@/server/api-response';
import {
  getUserPermissions,
  findById
} from '@/server/repositories/user-repository';

export type ClientSource = 'macos-app' | 'web-dashboard' | 'unknown';

export interface AuthContext {
  userId: string;
  email: string;
  permissions: string[];
  clientSource: ClientSource;
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

function extractClientSource(req: NextRequest): ClientSource {
  const clientType = req.headers.get('x-client-type');
  if (clientType === 'macos-app') return 'macos-app';
  if (clientType === 'web-dashboard') return 'web-dashboard';
  return 'web-dashboard';
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
      permissions: payload.permissions ?? [],
      clientSource: extractClientSource(req)
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

/**
 * macOS 客户端专用中间件：
 * 1. 确认请求来自 macos-app
 * 2. 检查用户 clientLoginEnabled 是否为 true（管理员单独控制的开关）
 */
export function withClientAuth(handler: AuthenticatedHandler) {
  return withJwtAuth(async (req, ctx) => {
    if (ctx.clientSource !== 'macos-app') {
      return errorResponse('This endpoint is for macOS client only', 403);
    }

    const user = await findById(ctx.userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    if (!user.clientLoginEnabled) {
      return errorResponse('Client login disabled for this account', 403);
    }

    return handler(req, ctx);
  });
}

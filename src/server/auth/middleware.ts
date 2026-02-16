import { type NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, type AccessTokenPayload } from './jwt'
import { errorResponse } from '@/server/api-response'

export interface AuthContext {
  userId: string
  email: string
  permissions: string[]
}

type AuthenticatedHandler = (
  req: NextRequest,
  ctx: AuthContext
) => Promise<NextResponse>

function extractBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) {
    return null
  }
  return header.slice(7)
}

export function withJwtAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest) => {
    const token = extractBearerToken(req)
    if (!token) {
      return errorResponse('Unauthorized', 401)
    }

    let payload: AccessTokenPayload
    try {
      payload = await verifyAccessToken(token)
    } catch {
      return errorResponse('Invalid or expired token', 401)
    }

    if (!payload.sub || !payload.email) {
      return errorResponse('Invalid token payload', 401)
    }

    const ctx: AuthContext = {
      userId: payload.sub,
      email: payload.email,
      permissions: payload.permissions ?? [],
    }

    return handler(req, ctx)
  }
}

export function withPermission(
  requiredPermission: string,
  handler: AuthenticatedHandler
) {
  return withJwtAuth(async (req, ctx) => {
    if (!ctx.permissions.includes(requiredPermission)) {
      return errorResponse('Forbidden', 403)
    }
    return handler(req, ctx)
  })
}

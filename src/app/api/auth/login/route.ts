import { NextRequest } from 'next/server'
import { loginSchema } from '@/server/auth/validation/schemas'
import { verifyPassword } from '@/server/auth/password'
import { createSessionAndTokens, sanitizeUser } from '@/server/auth/session'
import * as userRepo from '@/server/repositories/user-repository'
import { successResponse, errorResponse } from '@/server/api-response'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const { email, password, deviceId, deviceName, deviceType } = parsed.data

    const user = await userRepo.findByEmail(email)

    if (!user || !user.passwordHash) {
      return errorResponse('Invalid email or password', 401)
    }

    if (!user.emailVerifiedAt) {
      return errorResponse('Email not verified', 403)
    }

    const passwordValid = await verifyPassword(user.passwordHash, password)
    if (!passwordValid) {
      return errorResponse('Invalid email or password', 401)
    }

    await userRepo.updateLastLogin(user.id)

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      null
    const userAgent = req.headers.get('user-agent') ?? null

    const tokens = await createSessionAndTokens(user.id, user.email, 'jwt', {
      deviceId,
      deviceName,
      deviceType,
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined,
    })

    return successResponse({
      user: sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      sessionId: tokens.sessionId,
    })
  } catch (error) {
    console.error('Login error:', error)
    return errorResponse('Internal server error', 500)
  }
}

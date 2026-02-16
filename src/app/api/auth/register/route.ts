import { NextRequest } from 'next/server'
import { registerSchema } from '@/server/auth/validation/schemas'
import { verifyCode } from '@/server/auth/verification'
import { hashPassword } from '@/server/auth/password'
import { createSessionAndTokens, sanitizeUser } from '@/server/auth/session'
import * as userRepo from '@/server/repositories/user-repository'
import { successResponse, errorResponse } from '@/server/api-response'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const { email, code, password, username, fullName } = parsed.data

    const codeResult = await verifyCode(email, code)
    if (!codeResult.valid) {
      return errorResponse(codeResult.error ?? 'Invalid code', 400)
    }

    const passwordHash = await hashPassword(password)

    let user = await userRepo.findByEmail(email)

    if (user) {
      if (user.passwordHash) {
        return errorResponse('An account with this email already exists', 409)
      }

      user = await userRepo.linkPassword(user.id, passwordHash)
      if (username) {
        user = await userRepo.update(user.id, { username })
      }
      if (fullName) {
        user = await userRepo.update(user.id, { fullName })
      }
    } else {
      const adminEmails = (process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean)

      user = await userRepo.create({
        email,
        username,
        fullName,
        passwordHash,
        registrationSource: 'jwt',
        emailVerifiedAt: new Date(),
      })

      if (adminEmails.includes(email)) {
        await userRepo.assignRole(user.id, 'admin')
      }
      await userRepo.assignRole(user.id, 'user')
    }

    await userRepo.updateLastLogin(user.id)

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      null
    const userAgent = req.headers.get('user-agent') ?? null

    const tokens = await createSessionAndTokens(user.id, user.email, 'jwt', {
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined,
    })

    return successResponse(
      {
        user: sanitizeUser(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        sessionId: tokens.sessionId,
      },
      undefined,
      201
    )
  } catch (error) {
    console.error('Register error:', error)
    return errorResponse('Internal server error', 500)
  }
}

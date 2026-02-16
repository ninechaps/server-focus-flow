import { NextRequest } from 'next/server'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/server/db'
import { refreshTokens, userSessions } from '@/server/db/schema'
import { logoutSchema } from '@/server/auth/validation/schemas'
import { withJwtAuth, type AuthContext } from '@/server/auth/middleware'
import * as userRepo from '@/server/repositories/user-repository'
import { successResponse, errorResponse } from '@/server/api-response'

async function handler(req: NextRequest, ctx: AuthContext) {
  try {
    const body = await req.json()
    const parsed = logoutSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const { refreshToken, sessionId } = parsed.data

    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.token, refreshToken),
          eq(refreshTokens.userId, ctx.userId),
          isNull(refreshTokens.revokedAt)
        )
      )

    if (sessionId) {
      const session = await db.query.userSessions.findFirst({
        where: and(
          eq(userSessions.id, sessionId),
          eq(userSessions.userId, ctx.userId),
          isNull(userSessions.logoutAt)
        ),
      })

      if (session) {
        const now = new Date()
        const duration = Math.floor(
          (now.getTime() - session.loginAt.getTime()) / 1000
        )

        await db
          .update(userSessions)
          .set({ logoutAt: now, duration })
          .where(eq(userSessions.id, session.id))

        if (duration > 0) {
          await userRepo.addOnlineTime(ctx.userId, duration)
        }
      }
    }

    return successResponse({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export const POST = withJwtAuth(handler)

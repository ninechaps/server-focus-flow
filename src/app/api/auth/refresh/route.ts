import { NextRequest, NextResponse } from 'next/server';
import { eq, and, isNull } from 'drizzle-orm';
import { refreshSchema } from '@/server/auth/validation/schemas';
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken
} from '@/server/auth/jwt';
import { db } from '@/server/db';
import { refreshTokens } from '@/server/db/schema';
import * as userRepo from '@/server/repositories/user-repository';
import { errorResponse } from '@/server/api-response';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/'
};

const ACCESS_TOKEN_MAX_AGE = 24 * 60 * 60;
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = refreshSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const { refreshToken } = parsed.data;

    let payload;
    try {
      payload = await verifyRefreshToken(refreshToken);
    } catch {
      return errorResponse('Invalid or expired refresh token', 401);
    }

    if (!payload.sub || !payload.jti) {
      return errorResponse('Invalid token payload', 401);
    }

    const tokenRecord = await db.query.refreshTokens.findFirst({
      where: and(
        eq(refreshTokens.id, payload.jti),
        eq(refreshTokens.userId, payload.sub),
        isNull(refreshTokens.revokedAt)
      )
    });

    if (!tokenRecord) {
      return errorResponse('Token has been revoked', 401);
    }

    // Revoke old token
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, tokenRecord.id));

    // Get user permissions for new access token
    const user = await userRepo.findById(payload.sub);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    const permissions = await userRepo.getUserPermissions(user.id);

    const newAccessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      permissions
    });

    // Create new refresh token record
    const [newRefreshTokenRecord] = await db
      .insert(refreshTokens)
      .values({
        userId: user.id,
        token: crypto.randomUUID(),
        deviceId: tokenRecord.deviceId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
      .returning();

    const newRefreshToken = await signRefreshToken({
      userId: user.id,
      jti: newRefreshTokenRecord.id
    });

    await db
      .update(refreshTokens)
      .set({ token: newRefreshToken })
      .where(eq(refreshTokens.id, newRefreshTokenRecord.id));

    const response = NextResponse.json({
      success: true,
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken }
    });

    response.cookies.set('access_token', newAccessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE
    });
    response.cookies.set('refresh_token', newRefreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE
    });

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return errorResponse('Internal server error', 500);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import {
  loginSchema,
  registerSchema,
  validatePasswordPolicy
} from '@/server/auth/validation/schemas';
import { verifyPassword } from '@/server/auth/password';
import { createSessionAndTokens, sanitizeUser } from '@/server/auth/session';
import { registerUser, RegisterError } from '@/server/auth/register';
import * as userRepo from '@/server/repositories/user-repository';
import { verifyAccessToken } from '@/server/auth/jwt';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/server/db';
import { refreshTokens, userSessions } from '@/server/db/schema';
import { logoutSchema } from '@/server/auth/validation/schemas';
import { decryptPassword } from '@/server/auth/rsa';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/'
};

const ACCESS_TOKEN_MAX_AGE = 24 * 60 * 60;
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60;

function setTokenCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  sessionId: string,
  persistent = true
) {
  response.cookies.set('access_token', accessToken, {
    ...COOKIE_OPTIONS,
    ...(persistent ? { maxAge: ACCESS_TOKEN_MAX_AGE } : {})
  });
  response.cookies.set('refresh_token', refreshToken, {
    ...COOKIE_OPTIONS,
    ...(persistent ? { maxAge: REFRESH_TOKEN_MAX_AGE } : {})
  });
  response.cookies.set('session_id', sessionId, {
    ...COOKIE_OPTIONS,
    ...(persistent ? { maxAge: REFRESH_TOKEN_MAX_AGE } : {})
  });
}

function clearTokenCookies(response: NextResponse) {
  response.cookies.set('access_token', '', { ...COOKIE_OPTIONS, maxAge: 0 });
  response.cookies.set('refresh_token', '', { ...COOKIE_OPTIONS, maxAge: 0 });
  response.cookies.set('session_id', '', { ...COOKIE_OPTIONS, maxAge: 0 });
}

function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function errorJson(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

// POST /api/auth/session — Login (set cookies)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return errorJson(parsed.error.issues[0].message, 400);
    }

    const { email, encryptedPassword, rememberMe } = parsed.data;

    let password: string;
    try {
      password = decryptPassword(encryptedPassword);
    } catch {
      return errorJson('Invalid encrypted password', 400);
    }

    const user = await userRepo.findByEmail(email);

    console.log('[DEBUG] decrypted password:', password);
    console.log('[DEBUG] user found:', !!user);
    console.log('[DEBUG] passwordHash:', user?.passwordHash);

    if (!user || !user.passwordHash) {
      return errorJson('Invalid email or password', 401);
    }

    if (!user.emailVerifiedAt) {
      return errorJson('Email not verified', 403);
    }

    const passwordValid = await verifyPassword(user.passwordHash, password);
    console.log('[DEBUG] passwordValid:', passwordValid);
    if (!passwordValid) {
      return errorJson('Invalid email or password', 401);
    }

    await userRepo.updateLastLogin(user.id);

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      null;
    const userAgent = req.headers.get('user-agent') ?? null;

    const tokens = await createSessionAndTokens(user.id, user.email, 'jwt', {
      deviceName: 'Web Browser',
      deviceType: 'web',
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined
    });

    const response = jsonResponse({ user: sanitizeUser(user) });
    setTokenCookies(
      response,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.sessionId,
      rememberMe ?? false
    );

    return response;
  } catch (error) {
    console.error('Session login error:', error);
    return errorJson('Internal server error', 500);
  }
}

// PUT /api/auth/session — Register (set cookies)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return errorJson(parsed.error.issues[0].message, 400);
    }

    let password: string;
    try {
      password = decryptPassword(parsed.data.encryptedPassword);
    } catch {
      return errorJson('Invalid encrypted password', 400);
    }

    const policyError = validatePasswordPolicy(password);
    if (policyError) {
      return errorJson(policyError, 400);
    }

    const { user } = await registerUser({
      email: parsed.data.email,
      code: parsed.data.code,
      password,
      username: parsed.data.username,
      fullName: parsed.data.fullName,
      source: 'dashboard'
    });

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      null;
    const userAgent = req.headers.get('user-agent') ?? null;

    const tokens = await createSessionAndTokens(user.id, user.email, 'jwt', {
      deviceName: 'Web Browser',
      deviceType: 'web',
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined
    });

    const response = jsonResponse({ user }, 201);
    setTokenCookies(
      response,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.sessionId
    );

    return response;
  } catch (error) {
    if (error instanceof RegisterError) {
      return errorJson(error.message, error.statusCode);
    }
    console.error('Session register error:', error);
    return errorJson('Internal server error', 500);
  }
}

// DELETE /api/auth/session — Logout (clear cookies)
export async function DELETE(req: NextRequest) {
  try {
    const accessToken = req.cookies.get('access_token')?.value;
    const refreshToken = req.cookies.get('refresh_token')?.value;
    const sessionId = req.cookies.get('session_id')?.value;

    if (accessToken && refreshToken) {
      try {
        const payload = await verifyAccessToken(accessToken);
        const userId = payload.sub!;

        await db
          .update(refreshTokens)
          .set({ revokedAt: new Date() })
          .where(
            and(
              eq(refreshTokens.token, refreshToken),
              eq(refreshTokens.userId, userId),
              isNull(refreshTokens.revokedAt)
            )
          );

        if (sessionId) {
          const session = await db.query.userSessions.findFirst({
            where: and(
              eq(userSessions.id, sessionId),
              eq(userSessions.userId, userId),
              isNull(userSessions.logoutAt)
            )
          });

          if (session) {
            const now = new Date();
            const duration = Math.floor(
              (now.getTime() - session.loginAt.getTime()) / 1000
            );

            await db
              .update(userSessions)
              .set({ logoutAt: now, duration })
              .where(eq(userSessions.id, session.id));

            if (duration > 0) {
              await userRepo.addOnlineTime(userId, duration);
            }
          }
        }
      } catch {
        // Token expired or invalid — still clear cookies
      }
    }

    const response = NextResponse.json(
      { success: true, data: { message: 'Logged out successfully' } },
      { status: 200 }
    );
    clearTokenCookies(response);

    return response;
  } catch (error) {
    console.error('Session logout error:', error);
    return errorJson('Internal server error', 500);
  }
}

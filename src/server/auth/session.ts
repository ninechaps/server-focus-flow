import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import {
  refreshTokens,
  userSessions,
  type UserSession
} from '@/server/db/schema';
import { signAccessToken, signRefreshToken } from './jwt';
import * as userRepo from '@/server/repositories/user-repository';

interface DeviceInfo {
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
  ipAddress?: string;
  userAgent?: string;
  clientSource?: string;
}

interface TokenResult {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export async function createSessionAndTokens(
  userId: string,
  email: string,
  authMethod: string,
  device: DeviceInfo
): Promise<TokenResult> {
  const permissions = await userRepo.getUserPermissions(userId);

  const accessToken = await signAccessToken({ userId, email, permissions });

  const [refreshTokenRecord] = await db
    .insert(refreshTokens)
    .values({
      userId,
      token: crypto.randomUUID(),
      deviceId: device.deviceId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
    .returning();

  const refreshToken = await signRefreshToken({
    userId,
    jti: refreshTokenRecord.id
  });

  await db
    .update(refreshTokens)
    .set({ token: refreshToken })
    .where(eq(refreshTokens.id, refreshTokenRecord.id));

  const [session] = await db
    .insert(userSessions)
    .values({
      userId,
      deviceId: device.deviceId ?? 'unknown',
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
      authMethod,
      clientSource: device.clientSource ?? 'unknown'
    })
    .returning();

  return {
    accessToken,
    refreshToken,
    sessionId: session.id
  };
}

export function sanitizeUser(user: {
  id: string;
  email: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  registrationSource: string;
  emailVerifiedAt: Date | null;
  createdAt: Date | null;
  lastLoginAt: Date | null;
  totalOnlineTime: number | null;
  passwordHash?: string | null;
  clerkUserId?: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    registrationSource: user.registrationSource,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    totalOnlineTime: user.totalOnlineTime
  };
}

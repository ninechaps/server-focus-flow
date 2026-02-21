import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export interface AccessTokenPayload extends JWTPayload {
  sub: string;
  email: string;
  permissions: string[];
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string;
  jti: string;
}

const accessSecret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);

export async function signAccessToken(payload: {
  userId: string;
  email: string;
  permissions: string[];
}): Promise<string> {
  return new SignJWT({
    email: payload.email,
    permissions: payload.permissions
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(accessSecret);
}

export async function signRefreshToken(payload: {
  userId: string;
  jti: string;
}): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setJti(payload.jti)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(refreshSecret);
}

export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret);
  return payload as AccessTokenPayload;
}

export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, refreshSecret);
  return payload as RefreshTokenPayload;
}

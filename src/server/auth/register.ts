import { hashPassword } from '@/server/auth/password';
import { verifyCode } from '@/server/auth/verification';
import { sanitizeUser } from '@/server/auth/session';
import * as userRepo from '@/server/repositories/user-repository';

type SanitizedUser = ReturnType<typeof sanitizeUser>;

interface RegisterInput {
  email: string;
  code: string;
  password: string;
  username?: string;
  fullName?: string;
}

export async function registerUser(
  input: RegisterInput
): Promise<{ user: SanitizedUser }> {
  const { email, code, password, username, fullName } = input;

  const codeResult = await verifyCode(email, code);
  if (!codeResult.valid) {
    throw new RegisterError(codeResult.error ?? 'Invalid code', 400);
  }

  const passwordHash = await hashPassword(password);

  let user = await userRepo.findByEmail(email);

  if (user) {
    if (user.passwordHash) {
      throw new RegisterError('An account with this email already exists', 409);
    }

    user = await userRepo.linkPassword(user.id, passwordHash);
    if (username) {
      user = await userRepo.update(user.id, { username });
    }
    if (fullName) {
      user = await userRepo.update(user.id, { fullName });
    }
  } else {
    const adminEmails = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    user = await userRepo.create({
      email,
      username,
      fullName,
      passwordHash,
      registrationSource: 'jwt',
      emailVerifiedAt: new Date()
    });

    if (adminEmails.includes(email)) {
      await userRepo.assignRole(user.id, 'admin');
    }
    await userRepo.assignRole(user.id, 'user');
  }

  await userRepo.updateLastLogin(user.id);

  return { user: sanitizeUser(user) };
}

export class RegisterError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'RegisterError';
  }
}

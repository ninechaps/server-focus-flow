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
  /** 注册来源：dashboard = 管理后台，client = macOS 客户端 */
  source?: 'dashboard' | 'client';
}

export async function registerUser(
  input: RegisterInput
): Promise<{ user: SanitizedUser }> {
  const {
    email,
    code,
    password,
    username,
    fullName,
    source = 'dashboard'
  } = input;

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
    // 在创建用户前统计已有注册用户数，用于判断是否第一个用户
    const registeredCount = await userRepo.countRegisteredUsers();

    user = await userRepo.create({
      email,
      username,
      fullName,
      passwordHash,
      registrationSource: 'jwt',
      emailVerifiedAt: new Date()
    });

    if (registeredCount === 0) {
      // 数据库中第一个用户 → owner（最高权限）
      await userRepo.assignRole(user.id, 'owner');
    } else if (source === 'client') {
      // macOS 客户端注册 → user
      await userRepo.assignRole(user.id, 'user');
    } else {
      // 管理后台注册 → admin
      await userRepo.assignRole(user.id, 'admin');
    }
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

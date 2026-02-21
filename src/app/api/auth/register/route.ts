import { NextRequest, NextResponse } from 'next/server';
import {
  registerSchema,
  validatePasswordPolicy
} from '@/server/auth/validation/schemas';
import { registerUser, RegisterError } from '@/server/auth/register';
import { decryptPassword } from '@/server/auth/rsa';

// POST /api/auth/register — Client registration (no cookie/session)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    let password: string;
    try {
      password = decryptPassword(parsed.data.encryptedPassword);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid encrypted password' },
        { status: 400 }
      );
    }

    const policyError = validatePasswordPolicy(password);
    if (policyError) {
      return NextResponse.json(
        { success: false, error: policyError },
        { status: 400 }
      );
    }

    const { user } = await registerUser({
      email: parsed.data.email,
      code: parsed.data.code,
      password,
      username: parsed.data.username,
      fullName: parsed.data.fullName
    });

    return NextResponse.json(
      { success: true, data: { user } },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof RegisterError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    console.error('Client register error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

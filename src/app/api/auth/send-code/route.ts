import { NextRequest } from 'next/server';
import { sendCodeSchema } from '@/server/auth/validation/schemas';
import { sendVerificationCode } from '@/server/auth/verification';
import * as userRepo from '@/server/repositories/user-repository';
import { successResponse, errorResponse } from '@/server/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = sendCodeSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const { email, purpose } = parsed.data;

    if (purpose === 'register') {
      const existing = await userRepo.findByEmail(email);
      if (existing?.passwordHash) {
        return errorResponse(
          'An account with this email already exists. Please sign in instead.',
          409
        );
      }
    }

    const result = await sendVerificationCode(email);

    if (!result.success) {
      return errorResponse(result.error ?? 'Failed to send code', 429);
    }

    return successResponse({ message: 'Verification code sent' });
  } catch (error) {
    console.error('Send code error:', error);
    return errorResponse('Internal server error', 500);
  }
}

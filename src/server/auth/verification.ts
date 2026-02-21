import crypto from 'crypto';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { db } from '@/server/db';
import { emailVerificationCodes } from '@/server/db/schema';
import { resend } from '@/server/email/resend';
import { verificationCodeEmail } from '@/server/email/templates';

const CODE_EXPIRY_MINUTES = 10;
const RATE_LIMIT_SECONDS = 60;
const MAX_ATTEMPTS = 5;
const SENDER_EMAIL =
  process.env.EMAIL_FROM ?? 'Focus Flow <onboarding@resend.dev>';

function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function sendVerificationCode(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const recentCode = await db.query.emailVerificationCodes.findFirst({
    where: and(
      eq(emailVerificationCodes.email, email),
      gt(
        emailVerificationCodes.createdAt,
        new Date(Date.now() - RATE_LIMIT_SECONDS * 1000)
      )
    ),
    orderBy: desc(emailVerificationCodes.createdAt)
  });

  if (recentCode) {
    return {
      success: false,
      error: 'Please wait 60 seconds before requesting a new code'
    };
  }

  const code = generateCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CODE_EXPIRY_MINUTES * 60 * 1000);

  await db.insert(emailVerificationCodes).values({
    email,
    code,
    expiresAt,
    createdAt: now
  });

  if (resend) {
    try {
      const template = verificationCodeEmail(code);
      const { error: sendError } = await resend.emails.send({
        from: SENDER_EMAIL,
        to: email,
        subject: template.subject,
        html: template.html
      });

      if (sendError) {
        console.error('Resend API error:', sendError);
        return { success: false, error: 'Failed to send verification email' };
      }
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return { success: false, error: 'Failed to send verification email' };
    }
  } else {
    console.log(`[DEV] Verification code for ${email}: ${code}`);
  }

  return { success: true };
}

export async function verifyCode(
  email: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  const record = await db.query.emailVerificationCodes.findFirst({
    where: and(
      eq(emailVerificationCodes.email, email),
      isNull(emailVerificationCodes.usedAt)
    ),
    orderBy: desc(emailVerificationCodes.createdAt)
  });

  if (!record) {
    return { valid: false, error: 'No verification code found for this email' };
  }

  if (record.expiresAt < new Date()) {
    return { valid: false, error: 'Verification code has expired' };
  }

  if ((record.attempts ?? 0) >= MAX_ATTEMPTS) {
    return {
      valid: false,
      error: 'Too many attempts. Please request a new code'
    };
  }

  if (record.code !== code) {
    await db
      .update(emailVerificationCodes)
      .set({ attempts: (record.attempts ?? 0) + 1 })
      .where(eq(emailVerificationCodes.id, record.id));

    return { valid: false, error: 'Invalid verification code' };
  }

  await db
    .update(emailVerificationCodes)
    .set({ usedAt: new Date() })
    .where(eq(emailVerificationCodes.id, record.id));

  return { valid: true };
}

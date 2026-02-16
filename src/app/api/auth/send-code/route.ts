import { NextRequest } from 'next/server'
import { sendCodeSchema } from '@/server/auth/validation/schemas'
import { sendVerificationCode } from '@/server/auth/verification'
import { successResponse, errorResponse } from '@/server/api-response'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = sendCodeSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const result = await sendVerificationCode(parsed.data.email)

    if (!result.success) {
      return errorResponse(result.error ?? 'Failed to send code', 429)
    }

    return successResponse({ message: 'Verification code sent' })
  } catch (error) {
    console.error('Send code error:', error)
    return errorResponse('Internal server error', 500)
  }
}

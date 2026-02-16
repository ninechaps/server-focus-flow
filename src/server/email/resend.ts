import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY

if (!apiKey) {
  console.warn(
    'RESEND_API_KEY is not set. Email sending will be disabled. Verification codes will be logged to console.'
  )
}

export const resend = apiKey ? new Resend(apiKey) : null

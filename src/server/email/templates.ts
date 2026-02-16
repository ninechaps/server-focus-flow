export function verificationCodeEmail(code: string): {
  subject: string
  html: string
} {
  return {
    subject: `Your verification code: ${code}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #1a1a1a; margin-bottom: 24px;">Email Verification</h2>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5;">
          Your verification code is:
        </p>
        <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
        </div>
        <p style="color: #71717a; font-size: 14px; line-height: 1.5;">
          This code expires in 10 minutes. If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
    `,
  }
}

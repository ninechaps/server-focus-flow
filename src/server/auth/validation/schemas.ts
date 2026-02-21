import { z } from 'zod';

export const sendCodeSchema = z.object({
  email: z.string().email('Invalid email address'),
  purpose: z.enum(['register', 'reset']).optional()
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z
    .string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must be numeric'),
  encryptedPassword: z
    .string()
    .min(1, 'Encrypted password is required')
    .max(512, 'Encrypted password has invalid length'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(100, 'Username must be at most 100 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    )
    .optional(),
  fullName: z
    .string()
    .max(255, 'Full name must be at most 255 characters')
    .optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  encryptedPassword: z
    .string()
    .min(1, 'Encrypted password is required')
    .max(512, 'Encrypted password has invalid length'),
  rememberMe: z.boolean().optional(),
  deviceId: z.string().max(255).optional(),
  deviceName: z.string().max(255).optional(),
  deviceType: z
    .enum(['macos', 'ios', 'android', 'web', 'windows', 'linux'])
    .optional()
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
  sessionId: z.string().uuid('Invalid session ID').optional()
});

export const heartbeatSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID')
});

export const syncUploadSchema = z.object({
  encryptedData: z.string().min(1, 'Encrypted data is required'),
  dataHash: z
    .string()
    .min(1, 'Data hash is required')
    .max(64, 'Data hash must be at most 64 characters'),
  deviceId: z
    .string()
    .min(1, 'Device ID is required')
    .max(255, 'Device ID must be at most 255 characters')
});

export const statsUpdateSchema = z.object({
  onlineTime: z
    .number()
    .int('Online time must be an integer')
    .min(0, 'Online time must be non-negative')
});

const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;

export function validatePasswordPolicy(password: string): string | null {
  if (!PASSWORD_POLICY.test(password)) {
    return 'Password must be 8-128 characters with uppercase, lowercase, and number';
  }
  return null;
}

export type SendCodeInput = z.infer<typeof sendCodeSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type HeartbeatInput = z.infer<typeof heartbeatSchema>;
export type SyncUploadInput = z.infer<typeof syncUploadSchema>;
export type StatsUpdateInput = z.infer<typeof statsUpdateSchema>;

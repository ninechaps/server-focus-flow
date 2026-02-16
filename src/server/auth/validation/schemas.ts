import { z } from 'zod'

export const sendCodeSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z
    .string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must be numeric'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/\d/, 'Password must contain a number'),
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
    .optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  deviceId: z.string().max(255).optional(),
  deviceName: z.string().max(255).optional(),
  deviceType: z
    .enum(['macos', 'ios', 'android', 'web', 'windows', 'linux'])
    .optional(),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
  sessionId: z.string().uuid('Invalid session ID').optional(),
})

export const heartbeatSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
})

export const syncUploadSchema = z.object({
  encryptedData: z.string().min(1, 'Encrypted data is required'),
  dataHash: z
    .string()
    .min(1, 'Data hash is required')
    .max(64, 'Data hash must be at most 64 characters'),
  deviceId: z
    .string()
    .min(1, 'Device ID is required')
    .max(255, 'Device ID must be at most 255 characters'),
})

export const statsUpdateSchema = z.object({
  onlineTime: z
    .number()
    .int('Online time must be an integer')
    .min(0, 'Online time must be non-negative'),
})

export type SendCodeInput = z.infer<typeof sendCodeSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RefreshInput = z.infer<typeof refreshSchema>
export type LogoutInput = z.infer<typeof logoutSchema>
export type HeartbeatInput = z.infer<typeof heartbeatSchema>
export type SyncUploadInput = z.infer<typeof syncUploadSchema>
export type StatsUpdateInput = z.infer<typeof statsUpdateSchema>

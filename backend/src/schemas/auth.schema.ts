import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2).max(60),
  username: z.string().min(3).max(20).regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, underscores'),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .refine((p) => /[A-Z]/.test(p), 'Must contain uppercase letter')
    .refine((p) => /[0-9]/.test(p), 'Must contain a number'),
  dateOfBirth: z.string().refine((d) => {
    const dob = new Date(d);
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return age >= 18;
  }, 'Must be 18 or older'),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const CollegeEmailSchema = z.object({
  collegeEmail: z.string().email(),
});

export const OtpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
  deviceId: z.string().min(1),
});

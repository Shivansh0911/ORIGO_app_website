import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  name:       z.string().min(2).max(60).optional(),
  bio:        z.string().max(200).optional(),
  gender:     z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY']).optional(),
  lookingFor: z.array(z.enum(['FRIENDS', 'DATING', 'NETWORKING', 'STUDY_BUDDY'])).max(4).optional(),
});

export const UpdateInterestsSchema = z.object({
  interestIds: z.array(z.string().cuid()).max(10),
});

export const ReportUserSchema = z.object({
  reason: z.string().min(5).max(500),
});

export const PushTokenSchema = z.object({
  token: z.string().min(1).max(1000),
});

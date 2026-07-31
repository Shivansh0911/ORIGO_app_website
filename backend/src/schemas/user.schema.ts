import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  name:       z.string().min(2).max(60).optional(),
  bio:        z.string().max(200).optional(),
  gender:     z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY']).optional(),
  lookingFor: z.array(z.enum(['FRIENDS', 'DATING', 'NETWORKING', 'STUDY_BUDDY'])).max(4).optional(),
  // branch/hometown are user-editable — unlike joiningYear/degreeType, they
  // aren't encoded in the verified college ID, so there's nothing to derive.
  branch:     z.string().max(60).transform((s) => s.trim()).optional(),
  hometown:   z.string().max(60).transform((s) => s.trim()).optional(),
});

// UserPrivacy was previously create-only (defaults set at signup, deleted on
// account removal) with no update path anywhere — every toggle, including
// allowShipsFrom, was permanently stuck at its default. All fields optional
// so a client can patch just one setting at a time.
export const UpdatePrivacySchema = z.object({
  showOnlineStatus:  z.boolean().optional(),
  showLastSeen:      z.boolean().optional(),
  allowMessagesFrom: z.enum(['EVERYONE', 'MATCHES_ONLY', 'NOBODY']).optional(),
  showCollegeTo:     z.enum(['EVERYONE', 'CAMPUS_ONLY', 'MATCHES_ONLY', 'NOBODY']).optional(),
  showAgeOnProfile:  z.boolean().optional(),
  discoverableBy:    z.enum(['EVERYONE', 'CAMPUS_ONLY', 'MATCHES_ONLY', 'NOBODY']).optional(),
  allowShipsFrom:    z.boolean().optional(),
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

import { z } from 'zod';
import { PulseCategory } from '@prisma/client';

export const CreatePulseSchema = z.object({
  category: z.nativeEnum(PulseCategory),
  text:     z.string().min(1).max(140).transform((s) => s.trim()),
  vibe:     z.string().max(60).transform((s) => s.trim()).optional(),
  // How many responders the author wants. Clamped server-side against
  // PULSE_MAX_RESPONSES too — this bound is only to reject obvious nonsense
  // early, never the authority.
  maxResponses: z.number().int().min(1).max(50).optional(),
});

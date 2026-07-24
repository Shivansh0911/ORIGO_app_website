import { z } from 'zod';
import { PulseCategory } from '@prisma/client';

export const CreatePulseSchema = z.object({
  category: z.nativeEnum(PulseCategory),
  text:     z.string().min(1).max(140).transform((s) => s.trim()),
  vibe:     z.string().max(60).transform((s) => s.trim()).optional(),
});

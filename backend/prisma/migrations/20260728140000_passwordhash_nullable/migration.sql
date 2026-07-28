-- passwordHash must be nullable to support Google OAuth users who have no password.
-- The initial migration created it NOT NULL, but schema.prisma declares String? (nullable).
-- This migration corrects the drift so Google sign-up doesn't fail on prod.

ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

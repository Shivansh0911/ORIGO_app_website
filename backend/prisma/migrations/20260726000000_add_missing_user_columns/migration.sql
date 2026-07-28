-- Add googleId (Google OAuth link) and collegeEmailHash (SEC-03 blind index)
-- These were added to schema.prisma without a corresponding migration

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "collegeEmailHash" TEXT;

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_collegeEmailHash_key" ON "User"("collegeEmailHash");

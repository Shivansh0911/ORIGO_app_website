-- CreateTable
CREATE TABLE IF NOT EXISTS "UserPrompt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" VARCHAR(40) NOT NULL,
    "answer" VARCHAR(150) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserPrompt_userId_idx" ON "UserPrompt"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserPrompt_userId_position_key" ON "UserPrompt"("userId", "position");

-- AddForeignKey
ALTER TABLE "UserPrompt" DROP CONSTRAINT IF EXISTS "UserPrompt_userId_fkey";
ALTER TABLE "UserPrompt" ADD CONSTRAINT "UserPrompt_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

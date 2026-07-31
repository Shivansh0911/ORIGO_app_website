-- CreateTable
CREATE TABLE IF NOT EXISTS "HappeningEvent" (
    "id" TEXT NOT NULL,
    "collegeName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "emoji" TEXT NOT NULL DEFAULT '📅',
    "accent" TEXT NOT NULL DEFAULT '#6C3DFF',
    "cta" TEXT,
    "linkTo" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HappeningEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "HappeningEvent_collegeName_startAt_idx" ON "HappeningEvent"("collegeName", "startAt");

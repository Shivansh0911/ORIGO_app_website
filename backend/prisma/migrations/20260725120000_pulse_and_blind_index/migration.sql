-- SEC-03: college email blind index
ALTER TABLE "User" ADD COLUMN "collegeEmailHash" TEXT;
CREATE UNIQUE INDEX "User_collegeEmailHash_key" ON "User"("collegeEmailHash");

-- NotifType new values
ALTER TYPE "NotifType" ADD VALUE IF NOT EXISTS 'NEW_PULSE_RESPONSE';
ALTER TYPE "NotifType" ADD VALUE IF NOT EXISTS 'PULSE_EXPIRING';

-- Pulse enums
CREATE TYPE "PulseCategory" AS ENUM ('CHILL', 'MOVE', 'PLAY', 'TALK', 'GROW', 'DATE_PRACTICE');
CREATE TYPE "PulseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'FULFILLED', 'CANCELLED');

-- Pulse table
CREATE TABLE "Pulse" (
    "id"          TEXT NOT NULL,
    "authorId"    TEXT NOT NULL,
    "category"    "PulseCategory" NOT NULL,
    "text"        VARCHAR(140) NOT NULL,
    "vibe"        VARCHAR(60),
    "status"      "PulseStatus" NOT NULL DEFAULT 'ACTIVE',
    "collegeName" TEXT,
    "expiresAt"   TIMESTAMP(3) NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pulse_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Pulse_collegeName_status_expiresAt_idx" ON "Pulse"("collegeName", "status", "expiresAt");
CREATE INDEX "Pulse_authorId_status_idx" ON "Pulse"("authorId", "status");

ALTER TABLE "Pulse" ADD CONSTRAINT "Pulse_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PulseResponse table
CREATE TABLE "PulseResponse" (
    "id"            TEXT NOT NULL,
    "pulseId"       TEXT NOT NULL,
    "responderId"   TEXT NOT NULL,
    "rizzSessionId" TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PulseResponse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PulseResponse_pulseId_responderId_key" ON "PulseResponse"("pulseId", "responderId");

ALTER TABLE "PulseResponse" ADD CONSTRAINT "PulseResponse_pulseId_fkey"
    FOREIGN KEY ("pulseId") REFERENCES "Pulse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PulseResponse" ADD CONSTRAINT "PulseResponse_responderId_fkey"
    FOREIGN KEY ("responderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

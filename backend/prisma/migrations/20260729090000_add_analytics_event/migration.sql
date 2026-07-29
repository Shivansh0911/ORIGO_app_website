-- CreateTable
CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "props" JSONB,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_name_ts_idx" ON "AnalyticsEvent"("name", "ts");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_userId_ts_idx" ON "AnalyticsEvent"("userId", "ts");

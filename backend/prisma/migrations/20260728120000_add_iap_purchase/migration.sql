-- CreateEnum
CREATE TYPE "IapItem" AS ENUM ('SHIP', 'STICKER_BASIC', 'STICKER_PREMIUM', 'RIZZ_PACK', 'VIEW_SHIPS');

-- CreateTable
CREATE TABLE "IapPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "item" "IapItem" NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IapPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IapPurchase_razorpayOrderId_key" ON "IapPurchase"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "IapPurchase_userId_item_idx" ON "IapPurchase"("userId", "item");

-- AddForeignKey
ALTER TABLE "IapPurchase" ADD CONSTRAINT "IapPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Product comments and customer support
CREATE TYPE "ProductCommentType" AS ENUM ('COMMENT', 'QUESTION');
CREATE TYPE "ProductCommentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "SupportPriority" AS ENUM ('URGENT', 'HIGH', 'NORMAL', 'LOW');
CREATE TYPE "SupportTopic" AS ENUM ('ORDER', 'PAYMENT', 'PRODUCT', 'SHIPPING', 'ACCOUNT', 'OTHER');
CREATE TYPE "SupportTicketStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'ANSWERED', 'CLOSED');
CREATE TYPE "SupportSenderRole" AS ENUM ('USER', 'ADMIN');

CREATE TABLE "ProductComment" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "ProductCommentType" NOT NULL DEFAULT 'COMMENT',
    "content" TEXT NOT NULL,
    "status" "ProductCommentStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "SupportPriority" NOT NULL DEFAULT 'NORMAL',
    "adminReply" TEXT,
    "repliedAt" TIMESTAMP(3),
    "repliedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportTicket" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "topic" "SupportTopic" NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'NEW',
    "priority" "SupportPriority" NOT NULL DEFAULT 'NORMAL',
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportMessage" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "senderId" INTEGER,
    "senderRole" "SupportSenderRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductComment_productId_status_createdAt_idx" ON "ProductComment"("productId", "status", "createdAt");
CREATE INDEX "ProductComment_userId_createdAt_idx" ON "ProductComment"("userId", "createdAt");
CREATE INDEX "ProductComment_status_priority_createdAt_idx" ON "ProductComment"("status", "priority", "createdAt");
CREATE INDEX "SupportTicket_userId_lastMessageAt_idx" ON "SupportTicket"("userId", "lastMessageAt");
CREATE INDEX "SupportTicket_status_priority_lastMessageAt_idx" ON "SupportTicket"("status", "priority", "lastMessageAt");
CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");
CREATE INDEX "SupportMessage_ticketId_createdAt_idx" ON "SupportMessage"("ticketId", "createdAt");
CREATE INDEX "SupportMessage_senderId_createdAt_idx" ON "SupportMessage"("senderId", "createdAt");

ALTER TABLE "ProductComment" ADD CONSTRAINT "ProductComment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductComment" ADD CONSTRAINT "ProductComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductComment" ADD CONSTRAINT "ProductComment_repliedById_fkey" FOREIGN KEY ("repliedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

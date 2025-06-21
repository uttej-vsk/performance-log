-- AlterTable
ALTER TABLE "users" ADD COLUMN "jiraAccessToken" TEXT;
ALTER TABLE "users" ADD COLUMN "jiraCloudId" TEXT;
ALTER TABLE "users" ADD COLUMN "jiraConnectedAt" DATETIME;
ALTER TABLE "users" ADD COLUMN "jiraRefreshToken" TEXT;
ALTER TABLE "users" ADD COLUMN "jiraTokenExpiry" DATETIME;

-- CreateTable
CREATE TABLE "jira_ticket_caches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketKey" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "jira_ticket_caches_ticketKey_key" ON "jira_ticket_caches"("ticketKey");

-- CreateIndex
CREATE INDEX "jira_ticket_caches_ticketKey_userId_idx" ON "jira_ticket_caches"("ticketKey", "userId");

-- CreateIndex
CREATE INDEX "jira_ticket_caches_expiresAt_idx" ON "jira_ticket_caches"("expiresAt");

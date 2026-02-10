-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "import_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "bankSource" TEXT,
    "totalRows" INTEGER NOT NULL,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportStatus" NOT NULL DEFAULT 'PROCESSING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_logs_userId_idx" ON "import_logs"("userId");

-- AddForeignKey
ALTER TABLE "import_logs" ADD CONSTRAINT "import_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

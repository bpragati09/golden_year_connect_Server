/*
  Warnings:

  - You are about to drop the column `uuid` on the `Guardian` table. All the data in the column will be lost.
  - You are about to drop the column `uuid` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Guardian_uuid_key";

-- DropIndex
DROP INDEX "User_uuid_key";

-- AlterTable
ALTER TABLE "Guardian" DROP COLUMN "uuid";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "uuid";

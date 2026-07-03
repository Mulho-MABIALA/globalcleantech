-- CreateTable
CREATE TABLE "Service" (
    "id" SERIAL NOT NULL,
    "titre" VARCHAR(150) NOT NULL,
    "description" TEXT NOT NULL,
    "emoji" VARCHAR(10) NOT NULL,
    "couleur" VARCHAR(100) NOT NULL,
    "tags" VARCHAR(255) NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

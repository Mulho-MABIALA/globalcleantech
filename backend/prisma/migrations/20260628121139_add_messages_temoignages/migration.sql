-- CreateEnum
CREATE TYPE "StatutMessage" AS ENUM ('non_lu', 'lu', 'archive');

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "telephone" VARCHAR(20),
    "sujet" VARCHAR(200) NOT NULL,
    "corps" TEXT NOT NULL,
    "statut" "StatutMessage" NOT NULL DEFAULT 'non_lu',
    "noteAdmin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Temoignage" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "role" VARCHAR(100) NOT NULL,
    "texte" TEXT NOT NULL,
    "note" INTEGER NOT NULL DEFAULT 5,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Temoignage_pkey" PRIMARY KEY ("id")
);

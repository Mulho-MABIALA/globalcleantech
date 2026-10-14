-- CreateEnum
CREATE TYPE "EmplacementPub" AS ENUM ('accueil', 'popup', 'global');

-- CreateTable
CREATE TABLE "Publicite" (
    "id" SERIAL NOT NULL,
    "titre" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "annonceur" VARCHAR(150),
    "imagePath" VARCHAR(255),
    "lien" VARCHAR(255),
    "texteBouton" VARCHAR(50),
    "emplacement" "EmplacementPub" NOT NULL DEFAULT 'accueil',
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "vues" INTEGER NOT NULL DEFAULT 0,
    "clics" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publicite_pkey" PRIMARY KEY ("id")
);

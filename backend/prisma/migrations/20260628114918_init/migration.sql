-- CreateEnum
CREATE TYPE "PosteSouhaite" AS ENUM ('femme_menage', 'nounou', 'cuisinier', 'chauffeur', 'gardien', 'majordome', 'autre');

-- CreateEnum
CREATE TYPE "Experience" AS ENUM ('zero_un', 'un_trois', 'trois_cinq', 'cinq_plus');

-- CreateEnum
CREATE TYPE "StatutCandidature" AS ENUM ('a_traiter', 'en_cours', 'place', 'archive');

-- CreateEnum
CREATE TYPE "TypeDemandeur" AS ENUM ('particulier', 'entreprise', 'institution');

-- CreateEnum
CREATE TYPE "ServiceSouhaite" AS ENUM ('placement', 'impression', 'redaction', 'transfert', 'communication', 'autre');

-- CreateEnum
CREATE TYPE "StatutDemande" AS ENUM ('nouvelle', 'en_traitement', 'cloturee');

-- CreateEnum
CREATE TYPE "RoleUser" AS ENUM ('admin', 'gestionnaire');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password" TEXT NOT NULL,
    "role" "RoleUser" NOT NULL DEFAULT 'gestionnaire',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidature" (
    "id" SERIAL NOT NULL,
    "nomComplet" VARCHAR(150) NOT NULL,
    "dateNaissance" DATE NOT NULL,
    "telephone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(150),
    "ville" VARCHAR(100) NOT NULL,
    "posteSouhaite" "PosteSouhaite" NOT NULL,
    "experience" "Experience" NOT NULL,
    "description" TEXT,
    "cvPath" VARCHAR(255),
    "photoPath" VARCHAR(255),
    "disponibilite" VARCHAR(100) NOT NULL,
    "statut" "StatutCandidature" NOT NULL DEFAULT 'a_traiter',
    "notesInternes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Demande" (
    "id" SERIAL NOT NULL,
    "nomRaisonSociale" VARCHAR(150) NOT NULL,
    "typeDemandeur" "TypeDemandeur" NOT NULL,
    "telephone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "serviceSouhaite" "ServiceSouhaite" NOT NULL,
    "posteRecherche" VARCHAR(100),
    "nombrePersonnes" INTEGER,
    "description" TEXT NOT NULL,
    "budgetEstime" VARCHAR(100),
    "dateSouhaitee" DATE,
    "statut" "StatutDemande" NOT NULL DEFAULT 'nouvelle',
    "notesInternes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Demande_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

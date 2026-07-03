-- AlterTable
ALTER TABLE "Candidature" ADD COLUMN     "dateDisponibilite" DATE;

-- CreateTable
CREATE TABLE "Placement" (
    "id" SERIAL NOT NULL,
    "candidatureId" INTEGER NOT NULL,
    "demandeId" INTEGER,
    "dateDebut" DATE NOT NULL,
    "dateFin" DATE,
    "salaire" VARCHAR(100),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Placement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_candidatureId_fkey" FOREIGN KEY ("candidatureId") REFERENCES "Candidature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "Demande"("id") ON DELETE SET NULL ON UPDATE CASCADE;

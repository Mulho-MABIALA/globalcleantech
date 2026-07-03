-- CreateTable
CREATE TABLE "Actualite" (
    "id" SERIAL NOT NULL,
    "titre" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "categorie" VARCHAR(80) NOT NULL,
    "couleur" VARCHAR(50) NOT NULL DEFAULT 'emerald',
    "icone" VARCHAR(50) NOT NULL DEFAULT 'star',
    "lien" VARCHAR(255),
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Actualite_pkey" PRIMARY KEY ("id")
);

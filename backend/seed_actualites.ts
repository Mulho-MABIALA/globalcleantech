import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const items = [
  { titre: 'Comment bien préparer son entretien ?', description: 'Nos conseils pour faire bonne impression dès la première rencontre avec votre futur employeur.', categorie: 'Conseils emploi', couleur: 'emerald', icone: 'users', ordre: 1 },
  { titre: 'Transfert d\'argent : les délais expliqués', description: 'Tout ce qu\'il faut savoir sur les délais, frais et conditions pour envoyer de l\'argent en toute sécurité.', categorie: 'Services', couleur: 'amber', icone: 'money', ordre: 2 },
  { titre: 'Profils les plus demandés en 2024', description: 'Femme de ménage, cuisinier, nounou : découvrez quels profils sont les plus recherchés par nos clients.', categorie: 'Marché de l\'emploi', couleur: 'blue', icone: 'briefcase', ordre: 3 },
  { titre: 'Nos services d\'impression : tarifs & formats', description: 'Photocopies couleur, reliure, plastification... Tous nos formats disponibles à Thiès.', categorie: 'Services', couleur: 'purple', icone: 'printer', ordre: 4 },
  { titre: 'Travailler dans une famille : droits & devoirs', description: 'Guide pratique pour les travailleurs domestiques : contrat, horaires, congés et droits légaux.', categorie: 'Guide pratique', couleur: 'rose', icone: 'shield', ordre: 5 },
  { titre: 'Pourquoi choisir une agence de placement ?', description: 'Les avantages d\'un recrutement via Global Clean Tech vs une recherche indépendante.', categorie: 'Conseils', couleur: 'teal', icone: 'star', ordre: 6 },
]

async function main() {
  await prisma.actualite.deleteMany()
  for (const item of items) {
    await prisma.actualite.create({ data: item })
  }
  console.log('Actualités seedées.')
  await prisma.$disconnect()
}
main().catch(console.error)

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const services = [
  { titre: 'Placement de personnel', description: 'Femmes de ménage, nounous, cuisiniers, chauffeurs, gardiens, majordomes. Profils vérifiés et formés.', emoji: 'users', couleur: 'emerald', tags: 'Maison,Bureau,Entreprise', ordre: 1 },
  { titre: 'Communication & Journalisme', description: 'Rédaction de contenu, relations presse, communication digitale et institutionnelle.', emoji: 'megaphone', couleur: 'blue', tags: 'Presse,Digital,RP', ordre: 2 },
  { titre: 'Impression & Numérisation', description: 'Photocopie couleur et N&B, numérisation de documents, reliure, plastification.', emoji: 'printer', couleur: 'purple', tags: 'A4 / A3,Couleur,Numérique', ordre: 3 },
  { titre: "Transfert d'argent", description: "Envoi et réception d'argent rapides et sécurisés pour particuliers et entreprises.", emoji: 'money', couleur: 'amber', tags: 'Rapide,Sécurisé,Fiable', ordre: 4 },
  { titre: 'Services administratifs', description: 'Assistance aux démarches, rédaction de courriers, légalisation et certification de documents.', emoji: 'clipboard', couleur: 'rose', tags: 'Démarches,Courriers,Légalisation', ordre: 5 },
  { titre: 'Sur mesure', description: 'Un besoin spécifique ? Nous construisons ensemble la solution adaptée à votre situation.', emoji: 'star', couleur: 'teal', tags: 'Personnalisé,Flexible,Tout besoin', ordre: 6 },
]

async function main() {
  // Reset et re-seed pour mettre à jour les icônes
  await prisma.service.deleteMany()
  for (const s of services) {
    await prisma.service.create({ data: s })
  }
  console.log('Services re-seedés avec icônes SVG.')
  await prisma.$disconnect()
}

main().catch(console.error)

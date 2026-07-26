import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const hashed = await bcrypt.hash('Admin@GCT2024!', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@globalcleantech.sn' },
    update: {},
    create: {
      name: 'Administrateur',
      email: 'admin@globalcleantech.sn',
      password: hashed,
      role: 'admin',
    },
  })

  console.log('Admin créé :', admin.email)

  const temoignages = [
    { nom: 'Fatou Diallo', role: 'Particulier — Thiès', texte: 'Global Clean Tech nous a trouvé une excellente femme de ménage en moins de 48h. Sérieux, professionnalisme et suivi irréprochable. Je recommande vivement !', note: 5, ordre: 1 },
    { nom: 'Moussa Ndiaye', role: 'Directeur — Entreprise Ndiaye & Fils', texte: "Nous faisons appel à leurs services d'impression et de numérisation depuis 2 ans. Réactivité et qualité au rendez-vous à chaque fois.", note: 5, ordre: 2 },
    { nom: 'Aïssatou Sow', role: 'Gérante — Cabinet médical', texte: 'Grâce à Global Clean Tech, nous avons recruté un chauffeur et un gardien fiables. Le processus de vérification des profils est rassurant.', note: 5, ordre: 3 },
  ]

  for (const t of temoignages) {
    await prisma.temoignage.upsert({
      where: { id: t.ordre },
      update: {},
      create: t,
    })
  }
  console.log('Témoignages seedés :', temoignages.length)

  const services = [
    { id: 1, titre: 'Placement de personnel', description: 'Femmes de ménage, nounous, cuisiniers, chauffeurs, gardiens, majordomes. Profils vérifiés et formés.', emoji: 'users', couleur: 'emerald', tags: 'Maison,Bureau,Entreprise', ordre: 1, actif: true },
    { id: 2, titre: 'Communication & Journalisme', description: 'Rédaction de contenu, relations presse, communication digitale et institutionnelle.', emoji: 'megaphone', couleur: 'blue', tags: 'Presse,Digital,RP', ordre: 2, actif: true },
    { id: 3, titre: 'Impression & Numérisation', description: 'Photocopie couleur et N&B, numérisation de documents, reliure, plastification.', emoji: 'printer', couleur: 'purple', tags: 'A4 / A3,Couleur,Numérique', ordre: 3, actif: true },
    { id: 4, titre: "Transfert d'argent", description: "Envoi et réception d'argent rapides et sécurisés pour particuliers et entreprises.", emoji: 'money', couleur: 'amber', tags: 'Rapide,Sécurisé,Fiable', ordre: 4, actif: true },
    { id: 5, titre: 'Services administratifs', description: 'Assistance aux démarches, rédaction de courriers, légalisation et certification de documents.', emoji: 'clipboard', couleur: 'rose', tags: 'Démarches,Courriers,Légalisation', ordre: 5, actif: true },
    { id: 6, titre: 'Sur mesure', description: 'Un besoin spécifique ? Nous construisons ensemble la solution adaptée.', emoji: 'star', couleur: 'teal', tags: 'Personnalisé,Flexible,Tout besoin', ordre: 6, actif: true },
  ]

  for (const s of services) {
    await prisma.service.upsert({
      where: { id: s.id },
      update: {},
      create: s,
    })
  }
  console.log('Services seedés :', services.length)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

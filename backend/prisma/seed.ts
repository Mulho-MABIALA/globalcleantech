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
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

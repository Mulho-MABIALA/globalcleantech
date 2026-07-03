import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const items = [
  { cle: 'about_titre', valeur: 'Votre partenaire de confiance depuis plus de 5 ans à Thiès, Sénégal.' },
  { cle: 'about_histoire_titre', valeur: 'Qui sommes-nous ?' },
  { cle: 'about_histoire_p1', valeur: "Global Clean Tech est une entreprise multiservices basée à Thiès, au Sénégal. Fondée avec la conviction que chaque famille mérite un personnel de confiance et chaque candidat une chance d'accéder à l'emploi, nous avons bâti notre réputation sur le professionnalisme et la fiabilité." },
  { cle: 'about_histoire_p2', valeur: "Au fil des années, nous avons élargi notre offre pour proposer des services de communication, d'impression, de transfert d'argent et d'accompagnement administratif — toujours avec la même exigence de qualité." },
  { cle: 'about_valeur_1_titre', valeur: 'Intégrité' },
  { cle: 'about_valeur_1_desc', valeur: 'Transparence et honnêteté dans chaque transaction et chaque placement.' },
  { cle: 'about_valeur_2_titre', valeur: 'Excellence' },
  { cle: 'about_valeur_2_desc', valeur: 'Sélection rigoureuse et accompagnement continu de nos candidats.' },
  { cle: 'about_valeur_3_titre', valeur: 'Proximité' },
  { cle: 'about_valeur_3_desc', valeur: 'Une équipe locale disponible, à votre écoute, ancrée dans la réalité de Thiès.' },
  { cle: 'about_stat_placements', valeur: '500+' },
  { cle: 'about_stat_clients', valeur: '150+' },
  { cle: 'about_stat_annees', valeur: '5+' },
  { cle: 'about_stat_services', valeur: '6' },
]

async function main() {
  for (const item of items) {
    await prisma.siteContent.upsert({ where: { cle: item.cle }, update: { valeur: item.valeur }, create: item })
  }
  console.log('Contenu seedé.')
  await prisma.$disconnect()
}

main().catch(console.error)

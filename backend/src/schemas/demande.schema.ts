import { z } from 'zod'

export const DemandeSchema = z
  .object({
    nomRaisonSociale: z.string().min(2, 'Nom/Raison sociale requis').max(150),
    typeDemandeur: z.enum(['particulier', 'entreprise', 'institution']),
    telephone: z.string().min(8, 'Téléphone invalide').max(20),
    email: z.string().email('Email invalide').max(150),
    serviceSouhaite: z.enum([
      'placement',
      'impression',
      'redaction',
      'transfert',
      'communication',
      'autre',
    ]),
    posteRecherche: z.string().max(100).optional(),
    nombrePersonnes: z
      .union([z.number().int().positive(), z.string().transform(Number)])
      .optional(),
    description: z.string().min(10, 'Description requise (min 10 caractères)').max(2000),
    budgetEstime: z.string().max(100).optional(),
    dateSouhaitee: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.serviceSouhaite === 'placement') {
        return !!data.posteRecherche && data.posteRecherche.length > 0
      }
      return true
    },
    {
      message: 'Le poste recherché est requis pour une demande de placement.',
      path: ['posteRecherche'],
    }
  )

export type DemandeInput = z.infer<typeof DemandeSchema>

export const UpdateDemandeSchema = z.object({
  statut: z.enum(['nouvelle', 'en_traitement', 'cloturee']).optional(),
  notesInternes: z.string().max(2000).optional(),
})

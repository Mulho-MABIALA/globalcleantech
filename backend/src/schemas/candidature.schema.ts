import { z } from 'zod'

export const CandidatureSchema = z.object({
  nomComplet: z.string().min(2, 'Nom complet requis (min 2 caractères)').max(150),
  dateNaissance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
  telephone: z.string().min(8, 'Téléphone invalide').max(20),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  ville: z.string().min(2, 'Ville requise').max(100),
  posteSouhaite: z.enum([
    'femme_menage',
    'nounou',
    'cuisinier',
    'chauffeur',
    'gardien',
    'majordome',
    'autre',
  ]),
  experience: z.enum(['zero_un', 'un_trois', 'trois_cinq', 'cinq_plus']),
  description: z.string().max(1000).optional(),
  disponibilite: z.string().min(2, 'Disponibilité requise').max(100),
  dateDisponibilite: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),
  accepteConditions: z
    .union([z.literal('true'), z.literal(true)])
    .refine((v) => v === true || v === 'true', {
      message: 'Vous devez accepter les conditions.',
    }),
})

export type CandidatureInput = z.infer<typeof CandidatureSchema>

export const UpdateCandidatureSchema = z.object({
  statut: z
    .enum(['a_traiter', 'en_cours', 'place', 'archive'])
    .optional(),
  notesInternes: z.string().max(2000).optional(),
})

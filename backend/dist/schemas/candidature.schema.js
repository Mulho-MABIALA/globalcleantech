"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCandidatureSchema = exports.CandidatureSchema = void 0;
const zod_1 = require("zod");
exports.CandidatureSchema = zod_1.z.object({
    nomComplet: zod_1.z.string().min(2, 'Nom complet requis (min 2 caractères)').max(150),
    dateNaissance: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
    telephone: zod_1.z.string().min(8, 'Téléphone invalide').max(20),
    email: zod_1.z.string().email('Email invalide').optional().or(zod_1.z.literal('')),
    ville: zod_1.z.string().min(2, 'Ville requise').max(100),
    posteSouhaite: zod_1.z.enum([
        'femme_menage',
        'nounou',
        'cuisinier',
        'chauffeur',
        'gardien',
        'majordome',
        'autre',
    ]),
    experience: zod_1.z.enum(['zero_un', 'un_trois', 'trois_cinq', 'cinq_plus']),
    description: zod_1.z.string().max(1000).optional(),
    disponibilite: zod_1.z.string().min(2, 'Disponibilité requise').max(100),
    dateDisponibilite: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
        .optional()
        .or(zod_1.z.literal('')),
    accepteConditions: zod_1.z
        .union([zod_1.z.literal('true'), zod_1.z.literal(true)])
        .refine((v) => v === true || v === 'true', {
        message: 'Vous devez accepter les conditions.',
    }),
});
exports.UpdateCandidatureSchema = zod_1.z.object({
    statut: zod_1.z
        .enum(['a_traiter', 'en_cours', 'place', 'archive'])
        .optional(),
    notesInternes: zod_1.z.string().max(2000).optional(),
});
//# sourceMappingURL=candidature.schema.js.map
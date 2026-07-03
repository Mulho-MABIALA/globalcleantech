"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDemandeSchema = exports.DemandeSchema = void 0;
const zod_1 = require("zod");
exports.DemandeSchema = zod_1.z
    .object({
    nomRaisonSociale: zod_1.z.string().min(2, 'Nom/Raison sociale requis').max(150),
    typeDemandeur: zod_1.z.enum(['particulier', 'entreprise', 'institution']),
    telephone: zod_1.z.string().min(8, 'Téléphone invalide').max(20),
    email: zod_1.z.string().email('Email invalide').max(150),
    serviceSouhaite: zod_1.z.enum([
        'placement',
        'impression',
        'redaction',
        'transfert',
        'communication',
        'autre',
    ]),
    posteRecherche: zod_1.z.string().max(100).optional(),
    nombrePersonnes: zod_1.z
        .union([zod_1.z.number().int().positive(), zod_1.z.string().transform(Number)])
        .optional(),
    description: zod_1.z.string().min(10, 'Description requise (min 10 caractères)').max(2000),
    budgetEstime: zod_1.z.string().max(100).optional(),
    dateSouhaitee: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide')
        .optional()
        .or(zod_1.z.literal('')),
})
    .refine((data) => {
    if (data.serviceSouhaite === 'placement') {
        return !!data.posteRecherche && data.posteRecherche.length > 0;
    }
    return true;
}, {
    message: 'Le poste recherché est requis pour une demande de placement.',
    path: ['posteRecherche'],
});
exports.UpdateDemandeSchema = zod_1.z.object({
    statut: zod_1.z.enum(['nouvelle', 'en_traitement', 'cloturee']).optional(),
    notesInternes: zod_1.z.string().max(2000).optional(),
});
//# sourceMappingURL=demande.schema.js.map
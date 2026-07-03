import { z } from 'zod';
export declare const CandidatureSchema: z.ZodObject<{
    nomComplet: z.ZodString;
    dateNaissance: z.ZodString;
    telephone: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    ville: z.ZodString;
    posteSouhaite: z.ZodEnum<["femme_menage", "nounou", "cuisinier", "chauffeur", "gardien", "majordome", "autre"]>;
    experience: z.ZodEnum<["zero_un", "un_trois", "trois_cinq", "cinq_plus"]>;
    description: z.ZodOptional<z.ZodString>;
    disponibilite: z.ZodString;
    dateDisponibilite: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    accepteConditions: z.ZodEffects<z.ZodUnion<[z.ZodLiteral<"true">, z.ZodLiteral<true>]>, true | "true", true | "true">;
}, "strip", z.ZodTypeAny, {
    nomComplet: string;
    dateNaissance: string;
    telephone: string;
    ville: string;
    posteSouhaite: "femme_menage" | "nounou" | "cuisinier" | "chauffeur" | "gardien" | "majordome" | "autre";
    experience: "zero_un" | "un_trois" | "trois_cinq" | "cinq_plus";
    disponibilite: string;
    accepteConditions: true | "true";
    email?: string | undefined;
    description?: string | undefined;
    dateDisponibilite?: string | undefined;
}, {
    nomComplet: string;
    dateNaissance: string;
    telephone: string;
    ville: string;
    posteSouhaite: "femme_menage" | "nounou" | "cuisinier" | "chauffeur" | "gardien" | "majordome" | "autre";
    experience: "zero_un" | "un_trois" | "trois_cinq" | "cinq_plus";
    disponibilite: string;
    accepteConditions: true | "true";
    email?: string | undefined;
    description?: string | undefined;
    dateDisponibilite?: string | undefined;
}>;
export type CandidatureInput = z.infer<typeof CandidatureSchema>;
export declare const UpdateCandidatureSchema: z.ZodObject<{
    statut: z.ZodOptional<z.ZodEnum<["a_traiter", "en_cours", "place", "archive"]>>;
    notesInternes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    statut?: "a_traiter" | "en_cours" | "place" | "archive" | undefined;
    notesInternes?: string | undefined;
}, {
    statut?: "a_traiter" | "en_cours" | "place" | "archive" | undefined;
    notesInternes?: string | undefined;
}>;
//# sourceMappingURL=candidature.schema.d.ts.map
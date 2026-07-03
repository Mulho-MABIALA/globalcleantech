import { z } from 'zod';
export declare const DemandeSchema: z.ZodEffects<z.ZodObject<{
    nomRaisonSociale: z.ZodString;
    typeDemandeur: z.ZodEnum<["particulier", "entreprise", "institution"]>;
    telephone: z.ZodString;
    email: z.ZodString;
    serviceSouhaite: z.ZodEnum<["placement", "impression", "redaction", "transfert", "communication", "autre"]>;
    posteRecherche: z.ZodOptional<z.ZodString>;
    nombrePersonnes: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodEffects<z.ZodString, number, string>]>>;
    description: z.ZodString;
    budgetEstime: z.ZodOptional<z.ZodString>;
    dateSouhaitee: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, "strip", z.ZodTypeAny, {
    email: string;
    telephone: string;
    description: string;
    nomRaisonSociale: string;
    typeDemandeur: "particulier" | "entreprise" | "institution";
    serviceSouhaite: "autre" | "placement" | "impression" | "redaction" | "transfert" | "communication";
    posteRecherche?: string | undefined;
    nombrePersonnes?: number | undefined;
    budgetEstime?: string | undefined;
    dateSouhaitee?: string | undefined;
}, {
    email: string;
    telephone: string;
    description: string;
    nomRaisonSociale: string;
    typeDemandeur: "particulier" | "entreprise" | "institution";
    serviceSouhaite: "autre" | "placement" | "impression" | "redaction" | "transfert" | "communication";
    posteRecherche?: string | undefined;
    nombrePersonnes?: string | number | undefined;
    budgetEstime?: string | undefined;
    dateSouhaitee?: string | undefined;
}>, {
    email: string;
    telephone: string;
    description: string;
    nomRaisonSociale: string;
    typeDemandeur: "particulier" | "entreprise" | "institution";
    serviceSouhaite: "autre" | "placement" | "impression" | "redaction" | "transfert" | "communication";
    posteRecherche?: string | undefined;
    nombrePersonnes?: number | undefined;
    budgetEstime?: string | undefined;
    dateSouhaitee?: string | undefined;
}, {
    email: string;
    telephone: string;
    description: string;
    nomRaisonSociale: string;
    typeDemandeur: "particulier" | "entreprise" | "institution";
    serviceSouhaite: "autre" | "placement" | "impression" | "redaction" | "transfert" | "communication";
    posteRecherche?: string | undefined;
    nombrePersonnes?: string | number | undefined;
    budgetEstime?: string | undefined;
    dateSouhaitee?: string | undefined;
}>;
export type DemandeInput = z.infer<typeof DemandeSchema>;
export declare const UpdateDemandeSchema: z.ZodObject<{
    statut: z.ZodOptional<z.ZodEnum<["nouvelle", "en_traitement", "cloturee"]>>;
    notesInternes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    statut?: "nouvelle" | "en_traitement" | "cloturee" | undefined;
    notesInternes?: string | undefined;
}, {
    statut?: "nouvelle" | "en_traitement" | "cloturee" | undefined;
    notesInternes?: string | undefined;
}>;
//# sourceMappingURL=demande.schema.d.ts.map
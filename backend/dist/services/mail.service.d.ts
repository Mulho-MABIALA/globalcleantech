export declare function sendCandidatureAdminMail(data: {
    id: number;
    nomComplet: string;
    telephone: string;
    email?: string | null;
    ville: string;
    posteSouhaite: string;
    experience: string;
}): Promise<void>;
export declare function sendDemandeAdminMail(data: {
    id: number;
    nomRaisonSociale: string;
    telephone: string;
    email: string;
    serviceSouhaite: string;
    description: string;
}): Promise<void>;
export declare function sendMessageAdminMail(data: {
    id: number;
    nom: string;
    email: string;
    telephone?: string | null;
    sujet: string;
    corps: string;
}): Promise<void>;
export declare function sendStatutUpdateMail(data: {
    email: string;
    nom: string;
    statut: string;
    poste: string;
    id: number;
}): Promise<void>;
export declare function sendDemandeConfirmationMail(to: string, nom: string, service: string): Promise<void>;
//# sourceMappingURL=mail.service.d.ts.map
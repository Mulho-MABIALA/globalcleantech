export declare function sendMail(opts: {
    to: string;
    subject: string;
    html: string;
}): Promise<void>;
export declare function notifyCandidature(data: {
    nomComplet: string;
    posteSouhaite: string;
    telephone: string;
    email?: string | null;
}): Promise<void>;
export declare function notifyDemande(data: {
    nomRaisonSociale: string;
    serviceSouhaite: string;
    telephone: string;
    email?: string | null;
}): Promise<void>;
export declare function notifyContact(data: {
    nom: string;
    email: string;
    sujet: string;
    message: string;
}): Promise<void>;
export declare function notifyStatutCandidature(data: {
    email: string;
    nom: string;
    statut: string;
    poste: string;
}): Promise<void>;
//# sourceMappingURL=mailer.d.ts.map
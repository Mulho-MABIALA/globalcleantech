export type TypeDemandeur = 'particulier' | 'entreprise' | 'institution'

export type ServiceSouhaite =
  | 'placement'
  | 'impression'
  | 'redaction'
  | 'transfert'
  | 'communication'
  | 'autre'

export type StatutDemande = 'nouvelle' | 'en_traitement' | 'cloturee'

export interface Demande {
  id: number
  nomRaisonSociale: string
  typeDemandeur: TypeDemandeur
  telephone: string
  email: string
  serviceSouhaite: ServiceSouhaite
  posteRecherche?: string | null
  nombrePersonnes?: number | null
  description: string
  budgetEstime?: string | null
  dateSouhaitee?: string | null
  statut: StatutDemande
  notesInternes?: string | null
  createdAt: string
  updatedAt: string
}

export interface DemandeFormData {
  nomRaisonSociale: string
  typeDemandeur: TypeDemandeur
  telephone: string
  email: string
  serviceSouhaite: ServiceSouhaite
  posteRecherche?: string
  nombrePersonnes?: number
  description: string
  budgetEstime?: string
  dateSouhaitee?: string
}

export const SERVICE_LABELS: Record<ServiceSouhaite, string> = {
  placement: 'Placement de personnel',
  impression: 'Impression / Photocopie / Numérisation',
  redaction: 'Rédaction / Journalisme',
  transfert: "Transfert d'argent",
  communication: 'Communication',
  autre: 'Autre service',
}

export const TYPE_DEMANDEUR_LABELS: Record<TypeDemandeur, string> = {
  particulier: 'Particulier',
  entreprise: 'Entreprise',
  institution: 'Institution / ONG',
}

export const STATUT_DEMANDE_LABELS: Record<StatutDemande, string> = {
  nouvelle: 'Nouvelle',
  en_traitement: 'En traitement',
  cloturee: 'Clôturée',
}

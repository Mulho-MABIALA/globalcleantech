export type PosteSouhaite =
  | 'femme_menage'
  | 'nounou'
  | 'cuisinier'
  | 'chauffeur'
  | 'gardien'
  | 'majordome'
  | 'autre'

export type Experience = 'zero_un' | 'un_trois' | 'trois_cinq' | 'cinq_plus'

export type StatutCandidature = 'a_traiter' | 'en_cours' | 'place' | 'archive'

export interface Candidature {
  id: number
  nomComplet: string
  dateNaissance: string
  telephone: string
  email?: string | null
  ville: string
  posteSouhaite: PosteSouhaite
  experience: Experience
  description?: string | null
  cvPath?: string | null
  photoPath?: string | null
  cniRectoPath?: string | null
  cniVersoPath?: string | null
  disponibilite: string
  statut: StatutCandidature
  notesInternes?: string | null
  createdAt: string
  updatedAt: string
}

export interface CandidatureFormData {
  nomComplet: string
  dateNaissance: string
  telephone: string
  email?: string
  ville: string
  posteSouhaite: PosteSouhaite
  experience: Experience
  description?: string
  disponibilite: string
  accepteConditions: boolean
  cv?: FileList
  photo?: FileList
}

export const POSTE_LABELS: Record<PosteSouhaite, string> = {
  femme_menage: 'Femme de ménage',
  nounou: 'Nounou / Garde d\'enfants',
  cuisinier: 'Cuisinier(ère)',
  chauffeur: 'Chauffeur',
  gardien: 'Gardien / Vigile',
  majordome: 'Majordome',
  autre: 'Autre',
}

export const EXPERIENCE_LABELS: Record<Experience, string> = {
  zero_un: 'Moins d\'1 an',
  un_trois: '1 à 3 ans',
  trois_cinq: '3 à 5 ans',
  cinq_plus: 'Plus de 5 ans',
}

export const STATUT_CANDIDATURE_LABELS: Record<StatutCandidature, string> = {
  a_traiter: 'À traiter',
  en_cours: 'En cours',
  place: 'Placé(e)',
  archive: 'Archivé',
}

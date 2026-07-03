import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useCandidatures, useDeleteCandidature, useUpdateCandidature } from '../../hooks/useCandidatures'
import Modal from '../../components/ui/Modal'
import { api } from '../../services/api'
import { POSTE_LABELS, STATUT_CANDIDATURE_LABELS, StatutCandidature, Candidature } from '../../types/candidature'
import { whatsappLink } from '../../utils/contact'

const STATUT_STYLES: Record<StatutCandidature, string> = {
  a_traiter: 'bg-amber-50 text-amber-700 border-amber-200',
  en_cours: 'bg-blue-50 text-blue-700 border-blue-200',
  place: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  archive: 'bg-gray-100 text-gray-500 border-gray-200',
}

/* ── schema création manuelle ── */
const createSchema = z.object({
  nomComplet: z.string().min(2, 'Requis'),
  dateNaissance: z.string().min(1, 'Requis'),
  telephone: z.string().min(8, 'Requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  ville: z.string().min(2, 'Requis'),
  posteSouhaite: z.enum(['femme_menage', 'nounou', 'cuisinier', 'chauffeur', 'gardien', 'majordome', 'autre']),
  experience: z.enum(['zero_un', 'un_trois', 'trois_cinq', 'cinq_plus']),
  disponibilite: z.string().min(2, 'Requis'),
  description: z.string().max(1000).optional(),
  statut: z.enum(['a_traiter', 'en_cours', 'place', 'archive']).optional(),
  notesInternes: z.string().optional(),
  accepteConditions: z.literal(true).optional(),
})
type CreateForm = z.infer<typeof createSchema>

function FieldRow({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="form-label">{label}</label>
      {children}
      {error && <p className="form-error text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

export default function Candidatures() {
  const [page, setPage] = useState(1)
  const [statut, setStatut] = useState('')
  const [poste, setPoste] = useState('')
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const { data, isLoading } = useCandidatures({ page, statut, poste, search, limit: 20 })
  const deleteMut = useDeleteCandidature()
  const updateMut = useUpdateCandidature()
  const qc = useQueryClient()

  const changeStatut = async (c: Candidature, newStatut: string) => {
    try {
      await updateMut.mutateAsync({ id: c.id, statut: newStatut })
      toast.success(c.email ? 'Statut mis à jour — le candidat sera notifié par email.' : 'Statut mis à jour.')
    } catch { toast.error('Erreur lors du changement de statut.') }
  }

  const downloadCv = (c: Candidature) => {
    if (!c.cvPath) return
    const cleanPath = c.cvPath.replace(/\\/g, '/')
    api.get(`/uploads/${cleanPath}`, { responseType: 'blob' }).then((res) => {
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `CV-${c.nomComplet.replace(/\s+/g, '-')}${cleanPath.slice(cleanPath.lastIndexOf('.'))}`
      a.click()
      URL.revokeObjectURL(url)
    }).catch(() => toast.error('CV introuvable.'))
  }

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  })

  const createMut = useMutation({
    mutationFn: (fd: FormData) =>
      api.post('/candidatures', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
    onSuccess: () => {
      toast.success('Candidature créée avec succès.')
      qc.invalidateQueries({ queryKey: ['candidatures'] })
      setCreateOpen(false)
      reset()
      setCvFile(null)
      setPhotoFile(null)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Erreur lors de la création.')
    },
  })

  const onSubmit = (data: CreateForm) => {
    const fd = new FormData()
    fd.append('nomComplet', data.nomComplet)
    fd.append('dateNaissance', data.dateNaissance)
    fd.append('telephone', data.telephone)
    if (data.email) fd.append('email', data.email)
    fd.append('ville', data.ville)
    fd.append('posteSouhaite', data.posteSouhaite)
    fd.append('experience', data.experience)
    fd.append('disponibilite', data.disponibilite)
    if (data.description) fd.append('description', data.description)
    fd.append('accepteConditions', 'true')
    if (cvFile) fd.append('cv', cvFile)
    if (photoFile) fd.append('photo', photoFile)
    createMut.mutate(fd)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMut.mutateAsync(deleteId)
      toast.success('Candidature supprimée.')
      setDeleteId(null)
    } catch { toast.error('Erreur lors de la suppression.') }
  }

  const exportCsv = () => {
    api.get('/candidatures/export/csv', { responseType: 'blob' }).then((res) => {
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = 'candidatures.csv'; a.click()
      URL.revokeObjectURL(url)
    }).catch(() => toast.error("Échec de l'export."))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-dark">Candidatures</h1>
          <p className="text-muted text-sm mt-1">{data?.meta.total ?? 0} candidature(s) au total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="btn-outline text-sm py-2">Exporter CSV</button>
          <button
            onClick={() => { reset(); setCvFile(null); setPhotoFile(null); setCreateOpen(true) }}
            className="btn-primary text-sm py-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle candidature
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="card flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="form-input flex-1" placeholder="Rechercher nom, ville, téléphone..." />
        <select value={statut} onChange={(e) => { setStatut(e.target.value); setPage(1) }} className="form-input sm:w-44">
          <option value="">Tous les statuts</option>
          <option value="a_traiter">À traiter</option>
          <option value="en_cours">En cours</option>
          <option value="place">Placé(e)</option>
          <option value="archive">Archivé</option>
        </select>
        <select value={poste} onChange={(e) => { setPoste(e.target.value); setPage(1) }} className="form-input sm:w-52">
          <option value="">Tous les postes</option>
          {Object.entries(POSTE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Tableau */}
      {isLoading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="admin-table">
            <thead>
              <tr>
                {['#', 'Nom complet', 'Poste', 'Ville', 'Date', 'Statut', 'Actions'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.data.map(c => (
                <tr key={c.id}>
                  <td className="text-muted">#{c.id}</td>
                  <td className="font-medium text-dark">{c.nomComplet}</td>
                  <td className="text-muted">{POSTE_LABELS[c.posteSouhaite] || c.posteSouhaite}</td>
                  <td className="text-muted">{c.ville}</td>
                  <td className="text-muted whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <select
                      value={c.statut}
                      onChange={(e) => changeStatut(c, e.target.value)}
                      title="Changer le statut"
                      className={`statut-select ${STATUT_STYLES[c.statut]}`}
                    >
                      {Object.entries(STATUT_CANDIDATURE_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Link to={`/admin/candidatures/${c.id}`} className="table-action">Voir</Link>
                      <a
                        href={whatsappLink(c.telephone, `Bonjour ${c.nomComplet}, nous vous contactons au sujet de votre candidature chez Global Clean Tech.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Contacter sur WhatsApp"
                        className="table-icon text-[#25D366] hover:bg-[#25D366]/10"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                      </a>
                      <a href={`tel:${c.telephone}`} title="Appeler" className="table-icon text-blue-600 hover:bg-blue-50">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      </a>
                      {c.cvPath && (
                        <button onClick={() => downloadCv(c)} title="Télécharger le CV" className="table-icon text-primary hover:bg-primary/10">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </button>
                      )}
                      <button onClick={() => setDeleteId(c.id)} title="Supprimer" className="table-icon text-red-500 hover:bg-red-50">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-muted">Aucune candidature trouvée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.meta.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost disabled:opacity-40">←</button>
          <span className="text-sm text-muted">Page {page} / {data.meta.pages}</span>
          <button onClick={() => setPage(p => Math.min(data.meta.pages, p + 1))} disabled={page === data.meta.pages} className="btn-ghost disabled:opacity-40">→</button>
        </div>
      )}

      {/* ── Modal Création ── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nouvelle candidature" maxWidth="2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldRow id="nomComplet" label="Nom complet *" error={errors.nomComplet?.message}>
              <input id="nomComplet" {...register('nomComplet')} className={`form-input ${errors.nomComplet ? 'border-red-400' : ''}`} placeholder="Prénom Nom" />
            </FieldRow>
            <FieldRow id="dateNaissance" label="Date de naissance *" error={errors.dateNaissance?.message}>
              <input id="dateNaissance" type="date" {...register('dateNaissance')} className={`form-input ${errors.dateNaissance ? 'border-red-400' : ''}`} />
            </FieldRow>
            <FieldRow id="telephone" label="Téléphone *" error={errors.telephone?.message}>
              <input id="telephone" {...register('telephone')} className={`form-input ${errors.telephone ? 'border-red-400' : ''}`} placeholder="+221 7X XXX XX XX" />
            </FieldRow>
            <FieldRow id="email" label="Email" error={errors.email?.message}>
              <input id="email" type="email" {...register('email')} className="form-input" placeholder="email@exemple.com" />
            </FieldRow>
            <FieldRow id="ville" label="Ville *" error={errors.ville?.message}>
              <input id="ville" {...register('ville')} className={`form-input ${errors.ville ? 'border-red-400' : ''}`} placeholder="Thiès" />
            </FieldRow>
            <FieldRow id="disponibilite" label="Disponibilité *" error={errors.disponibilite?.message}>
              <input id="disponibilite" {...register('disponibilite')} className={`form-input ${errors.disponibilite ? 'border-red-400' : ''}`} placeholder="Immédiate, 1 mois..." />
            </FieldRow>
            <FieldRow id="posteSouhaite" label="Poste souhaité *" error={errors.posteSouhaite?.message}>
              <select id="posteSouhaite" {...register('posteSouhaite')} className={`form-input ${errors.posteSouhaite ? 'border-red-400' : ''}`}>
                <option value="">-- Choisir --</option>
                {Object.entries(POSTE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </FieldRow>
            <FieldRow id="experience" label="Expérience *" error={errors.experience?.message}>
              <select id="experience" {...register('experience')} className={`form-input ${errors.experience ? 'border-red-400' : ''}`}>
                <option value="">-- Choisir --</option>
                <option value="zero_un">Moins d'1 an</option>
                <option value="un_trois">1 à 3 ans</option>
                <option value="trois_cinq">3 à 5 ans</option>
                <option value="cinq_plus">Plus de 5 ans</option>
              </select>
            </FieldRow>
          </div>

          <FieldRow id="description" label="Notes / Description" error={undefined}>
            <textarea id="description" {...register('description')} rows={3} className="form-input resize-none" placeholder="Compétences, expérience, observations..." />
          </FieldRow>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-surface rounded-xl">
            <div>
              <p className="form-label mb-1.5">CV (PDF, DOC — max 5 Mo)</p>
              <label className="flex items-center gap-2 border border-dashed border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:border-primary transition-colors text-sm text-muted hover:text-primary">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                {cvFile ? <span className="text-primary truncate">{cvFile.name}</span> : 'Choisir un fichier'}
                <input type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={e => setCvFile(e.target.files?.[0] || null)} />
              </label>
            </div>
            <div>
              <p className="form-label mb-1.5">Photo (JPG, PNG — max 2 Mo)</p>
              <label className="flex items-center gap-2 border border-dashed border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:border-primary transition-colors text-sm text-muted hover:text-primary">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {photoFile ? <span className="text-primary truncate">{photoFile.name}</span> : 'Choisir un fichier'}
                <input type="file" accept=".jpg,.jpeg,.png,.webp" className="sr-only" onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-ghost">Annuler</button>
            <button type="submit" disabled={createMut.isPending} className="btn-primary">
              {createMut.isPending ? 'Enregistrement...' : 'Créer la candidature'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Suppression ── */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmer la suppression">
        <p className="text-muted mb-6">Cette action est irréversible. La candidature et ses fichiers seront définitivement supprimés.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-ghost">Annuler</button>
          <button onClick={confirmDelete} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm font-medium">Supprimer</button>
        </div>
      </Modal>
    </div>
  )
}

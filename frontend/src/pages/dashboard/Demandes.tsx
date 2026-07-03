import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDemandes, useDeleteDemande, useUpdateDemande } from '../../hooks/useDemandes'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { api } from '../../services/api'
import { SERVICE_LABELS, STATUT_DEMANDE_LABELS, StatutDemande, Demande } from '../../types/demande'
import { whatsappLink } from '../../utils/contact'

const STATUT_STYLES: Record<StatutDemande, string> = {
  nouvelle: 'bg-amber-50 text-amber-700 border-amber-200',
  en_traitement: 'bg-blue-50 text-blue-700 border-blue-200',
  cloturee: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const SERVICE_OPTIONS = [
  { value: 'placement', label: '👥 Placement de personnel' },
  { value: 'impression', label: '🖨️ Impression / Numérisation' },
  { value: 'redaction', label: '✍️ Rédaction / Journalisme' },
  { value: 'transfert', label: "💸 Transfert d'argent" },
  { value: 'communication', label: '📢 Communication' },
  { value: 'autre', label: '✨ Autre service' },
]

const createSchema = z
  .object({
    nomRaisonSociale: z.string().min(2, 'Requis'),
    typeDemandeur: z.enum(['particulier', 'entreprise', 'institution']),
    telephone: z.string().min(8, 'Requis'),
    email: z.string().email('Email invalide'),
    serviceSouhaite: z.enum(['placement', 'impression', 'redaction', 'transfert', 'communication', 'autre']),
    posteRecherche: z.string().max(100).optional(),
    nombrePersonnes: z.string().optional(),
    description: z.string().min(5, 'Requis'),
    budgetEstime: z.string().optional(),
    dateSouhaitee: z.string().optional(),
  })
  .refine((d) => d.serviceSouhaite !== 'placement' || (d.posteRecherche && d.posteRecherche.length > 0), {
    message: 'Précisez le poste recherché.', path: ['posteRecherche'],
  })

type CreateForm = z.infer<typeof createSchema>

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="form-label">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

export default function Demandes() {
  const [page, setPage] = useState(1)
  const [statut, setStatut] = useState('')
  const [service, setService] = useState('')
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading } = useDemandes({ page, statut, service, search, limit: 20 })
  const deleteMut = useDeleteDemande()
  const updateMut = useUpdateDemande()
  const qc = useQueryClient()

  const changeStatut = async (d: Demande, newStatut: string) => {
    try {
      await updateMut.mutateAsync({ id: d.id, statut: newStatut })
      toast.success('Statut mis à jour.')
    } catch { toast.error('Erreur lors du changement de statut.') }
  }

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  })
  const selectedService = watch('serviceSouhaite')

  const createMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/demandes', body).then(r => r.data),
    onSuccess: () => {
      toast.success('Demande créée avec succès.')
      qc.invalidateQueries({ queryKey: ['demandes'] })
      setCreateOpen(false)
      reset()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Erreur lors de la création.')
    },
  })

  const onSubmit = (data: CreateForm) => {
    createMut.mutate({
      ...data,
      nombrePersonnes: data.nombrePersonnes ? parseInt(data.nombrePersonnes) : undefined,
    })
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMut.mutateAsync(deleteId)
      toast.success('Demande supprimée.')
      setDeleteId(null)
    } catch { toast.error('Erreur lors de la suppression.') }
  }

  const exportCsv = () => {
    api.get('/demandes/export/csv', { responseType: 'blob' }).then((res) => {
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url; a.download = 'demandes.csv'; a.click()
      URL.revokeObjectURL(url)
    }).catch(() => toast.error("Échec de l'export."))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-dark">Demandes clients</h1>
          <p className="text-muted text-sm mt-1">{data?.meta.total ?? 0} demande(s) au total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="btn-outline text-sm py-2">Exporter CSV</button>
          <button
            onClick={() => { reset(); setCreateOpen(true) }}
            className="btn-primary text-sm py-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle demande
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="card flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="form-input flex-1" placeholder="Rechercher nom, email, téléphone..." />
        <select value={statut} onChange={(e) => { setStatut(e.target.value); setPage(1) }} className="form-input sm:w-44">
          <option value="">Tous les statuts</option>
          <option value="nouvelle">Nouvelle</option>
          <option value="en_traitement">En traitement</option>
          <option value="cloturee">Clôturée</option>
        </select>
        <select value={service} onChange={(e) => { setService(e.target.value); setPage(1) }} className="form-input sm:w-52">
          <option value="">Tous les services</option>
          {Object.entries(SERVICE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
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
                {['#', 'Nom / Raison sociale', 'Service', 'Email', 'Date', 'Statut', 'Actions'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.data.map((d) => (
                <tr key={d.id}>
                  <td className="text-muted">#{d.id}</td>
                  <td className="font-medium text-dark">{d.nomRaisonSociale}</td>
                  <td className="text-muted">{SERVICE_LABELS[d.serviceSouhaite] || d.serviceSouhaite}</td>
                  <td className="text-muted">{d.email}</td>
                  <td className="text-muted whitespace-nowrap">{new Date(d.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <select
                      value={d.statut}
                      onChange={(e) => changeStatut(d, e.target.value)}
                      title="Changer le statut"
                      className={`statut-select ${STATUT_STYLES[d.statut]}`}
                    >
                      {Object.entries(STATUT_DEMANDE_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Link to={`/admin/demandes/${d.id}`} className="table-action">Voir</Link>
                      <a
                        href={whatsappLink(d.telephone, `Bonjour, nous vous contactons au sujet de votre demande (${SERVICE_LABELS[d.serviceSouhaite] ?? d.serviceSouhaite}) chez Global Clean Tech.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Contacter sur WhatsApp"
                        className="table-icon text-[#25D366] hover:bg-[#25D366]/10"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                      </a>
                      <a href={`tel:${d.telephone}`} title="Appeler" className="table-icon text-blue-600 hover:bg-blue-50">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      </a>
                      <button onClick={() => setDeleteId(d.id)} title="Supprimer" className="table-icon text-red-500 hover:bg-red-50">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-muted">Aucune demande trouvée.</td></tr>
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
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nouvelle demande client" maxWidth="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="nomRaisonSociale" label="Nom / Raison sociale *" error={errors.nomRaisonSociale?.message}>
              <input id="nomRaisonSociale" {...register('nomRaisonSociale')} className={`form-input ${errors.nomRaisonSociale ? 'border-red-400' : ''}`} placeholder="Nom du client ou de l'entreprise" />
            </Field>
            <Field id="typeDemandeur" label="Type de demandeur *" error={errors.typeDemandeur?.message}>
              <select id="typeDemandeur" {...register('typeDemandeur')} className={`form-input ${errors.typeDemandeur ? 'border-red-400' : ''}`}>
                <option value="">-- Choisir --</option>
                <option value="particulier">Particulier</option>
                <option value="entreprise">Entreprise</option>
                <option value="institution">Institution / ONG</option>
              </select>
            </Field>
            <Field id="telephone" label="Téléphone *" error={errors.telephone?.message}>
              <input id="telephone" {...register('telephone')} className={`form-input ${errors.telephone ? 'border-red-400' : ''}`} placeholder="+221 7X XXX XX XX" />
            </Field>
            <Field id="email" label="Email *" error={errors.email?.message}>
              <input id="email" type="email" {...register('email')} className={`form-input ${errors.email ? 'border-red-400' : ''}`} placeholder="client@exemple.com" />
            </Field>
          </div>

          {/* Service selector */}
          <div>
            <p className="form-label mb-2">Service souhaité *</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SERVICE_OPTIONS.map((opt) => (
                <label key={opt.value} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer text-sm font-medium transition-all duration-150
                  ${selectedService === opt.value ? 'border-accent bg-accent-light text-accent' : 'border-gray-200 text-muted hover:border-accent/40 hover:bg-accent-light/30'}`}>
                  <input type="radio" value={opt.value} {...register('serviceSouhaite')} className="sr-only" />
                  {opt.label}
                </label>
              ))}
            </div>
            {errors.serviceSouhaite && <p className="text-red-500 text-xs mt-1">{errors.serviceSouhaite.message}</p>}
          </div>

          {selectedService === 'placement' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface rounded-xl border border-gray-100">
              <Field id="posteRecherche" label="Poste recherché *" error={errors.posteRecherche?.message}>
                <input id="posteRecherche" {...register('posteRecherche')} className={`form-input ${errors.posteRecherche ? 'border-red-400' : ''}`} placeholder="Ex: Femme de ménage..." />
              </Field>
              <Field id="nombrePersonnes" label="Nombre de personnes" error={undefined}>
                <input id="nombrePersonnes" type="number" min="1" {...register('nombrePersonnes')} className="form-input" placeholder="1" />
              </Field>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="budgetEstime" label="Budget estimé (facultatif)" error={undefined}>
              <input id="budgetEstime" {...register('budgetEstime')} className="form-input" placeholder="Ex: 50 000 FCFA/mois" />
            </Field>
            <Field id="dateSouhaitee" label="Date souhaitée (facultatif)" error={undefined}>
              <input id="dateSouhaitee" type="date" {...register('dateSouhaitee')} className="form-input" />
            </Field>
          </div>

          <Field id="description" label="Description du besoin *" error={errors.description?.message}>
            <textarea id="description" {...register('description')} rows={3} className={`form-input resize-none ${errors.description ? 'border-red-400' : ''}`} placeholder="Détaillez le besoin : horaires, lieu, exigences..." />
          </Field>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-ghost">Annuler</button>
            <button type="submit" disabled={createMut.isPending} className="btn-primary">
              {createMut.isPending ? 'Enregistrement...' : 'Créer la demande'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Suppression ── */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmer la suppression">
        <p className="text-muted mb-6">Cette demande sera définitivement supprimée.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-ghost">Annuler</button>
          <button onClick={confirmDelete} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm font-medium">Supprimer</button>
        </div>
      </Modal>
    </div>
  )
}

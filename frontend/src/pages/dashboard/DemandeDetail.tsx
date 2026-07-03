import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDemande, useUpdateDemande, useDeleteDemande } from '../../hooks/useDemandes'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { SERVICE_LABELS, TYPE_DEMANDEUR_LABELS, STATUT_DEMANDE_LABELS } from '../../types/demande'

export default function DemandeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: d, isLoading } = useDemande(Number(id))
  const updateMut = useUpdateDemande()
  const deleteMut = useDeleteDemande()

  const [statut, setStatut] = useState('')
  const [notes, setNotes] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  React.useEffect(() => {
    if (d) {
      setStatut(d.statut)
      setNotes(d.notesInternes || '')
    }
  }, [d])

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  if (!d) return <div className="text-center py-16 text-muted">Demande introuvable.</div>

  const saveStatut = async () => {
    try { await updateMut.mutateAsync({ id: d.id, statut }); toast.success('Statut mis à jour.') }
    catch { toast.error('Erreur.') }
  }

  const saveNotes = async () => {
    try { await updateMut.mutateAsync({ id: d.id, notesInternes: notes }); toast.success('Notes enregistrées.') }
    catch { toast.error('Erreur.') }
  }

  const handleDelete = async () => {
    try {
      await deleteMut.mutateAsync(d.id)
      toast.success('Demande supprimée.')
      navigate('/admin/demandes')
    } catch { toast.error('Erreur.') }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/admin/demandes" className="text-muted hover:text-dark text-sm">← Demandes</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-dark font-medium">#{d.id} — {d.nomRaisonSociale}</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-dark">{d.nomRaisonSociale}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge status={d.statut} />
            <span className="text-sm text-muted">{SERVICE_LABELS[d.serviceSouhaite]}</span>
          </div>
        </div>
        <button onClick={() => setDeleteOpen(true)} className="text-red-500 text-sm hover:underline">Supprimer</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="font-semibold font-display text-dark mb-4">Informations du demandeur</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Type', TYPE_DEMANDEUR_LABELS[d.typeDemandeur]],
                ['Téléphone', d.telephone],
                ['Email', d.email],
                ['Service souhaité', SERVICE_LABELS[d.serviceSouhaite]],
                d.posteRecherche ? ['Poste recherché', d.posteRecherche] : null,
                d.nombrePersonnes ? ['Nombre de personnes', String(d.nombrePersonnes)] : null,
                d.budgetEstime ? ['Budget estimé', d.budgetEstime] : null,
                d.dateSouhaitee ? ['Date souhaitée', new Date(d.dateSouhaitee).toLocaleDateString('fr-FR')] : null,
              ].filter(Boolean).map((item) => {
                const [k, v] = item as [string, string]
                return (
                  <div key={k}>
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-medium text-dark mt-0.5">{v}</dd>
                  </div>
                )
              })}
            </dl>
          </div>

          <div className="card">
            <h2 className="font-semibold font-display text-dark mb-2">Description du besoin</h2>
            <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{d.description}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold font-display text-dark mb-3">Changer le statut</h2>
            <select value={statut} onChange={(e) => setStatut(e.target.value)} className="form-input mb-3">
              {Object.entries(STATUT_DEMANDE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <button onClick={saveStatut} disabled={updateMut.isPending} className="btn-primary w-full text-sm py-2">
              Enregistrer
            </button>
          </div>

          <div className="card">
            <h2 className="font-semibold font-display text-dark mb-3">Notes internes</h2>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} className="form-input resize-none text-sm mb-3" placeholder="Observations, suivis..." />
            <button onClick={saveNotes} disabled={updateMut.isPending} className="btn-outline w-full text-sm py-2">Sauvegarder</button>
          </div>

          <div className="card text-xs text-muted space-y-1">
            <p>Reçue le {new Date(d.createdAt).toLocaleDateString('fr-FR')}</p>
            <p>Modifiée le {new Date(d.updatedAt).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      </div>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Confirmer la suppression">
        <p className="text-muted mb-6">Supprimer définitivement la demande de <strong>{d.nomRaisonSociale}</strong> ?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteOpen(false)} className="btn-ghost">Annuler</button>
          <button onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600">Supprimer</button>
        </div>
      </Modal>
    </div>
  )
}

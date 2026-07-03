import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlacements, useDeletePlacement, Placement } from '../../hooks/usePlacements'
import { POSTE_LABELS, PosteSouhaite } from '../../types/candidature'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { api } from '../../services/api'

export default function Placements() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [mois, setMois] = useState(() => new Date().toISOString().slice(0, 7))

  const { data, isLoading } = usePlacements({ page, search })
  const deleteMut = useDeletePlacement()

  const confirmDelete = async () => {
    if (!deleteId) return
    await deleteMut.mutateAsync(deleteId)
    toast.success('Placement supprimé.')
    setDeleteId(null)
  }

  const exportCsv = () => {
    api.get(`/dashboard/rapport-mensuel/csv?mois=${mois}`, { responseType: 'blob' }).then(res => {
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = `placements-${mois}.csv`; a.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black font-display text-dark">Placements</h1>
          <p className="text-muted text-sm mt-0.5">{data?.meta.total ?? 0} placement(s) enregistré(s)</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="month" value={mois} onChange={e => setMois(e.target.value)} className="form-input text-sm py-2 w-40" />
          <button onClick={exportCsv} className="btn-outline text-sm py-2">Export CSV</button>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="form-input" placeholder="Rechercher par candidat ou client..." />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="space-y-3">
          {data?.data.length === 0 && (
            <div className="card text-center py-12 text-muted">
              <div className="text-4xl mb-3">🤝</div>
              <p className="font-medium">Aucun placement enregistré</p>
              <p className="text-sm mt-1">Les placements apparaissent ici quand une candidature passe au statut "Placé(e)".</p>
            </div>
          )}
          {data?.data.map((p: Placement) => (
            <div key={p.id} className="card flex items-center gap-4 flex-wrap hover:shadow-md transition-shadow">
              {/* Avatar candidat */}
              <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
                {p.candidature.nomComplet[0]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-semibold text-dark">{p.candidature.nomComplet}</p>
                    <p className="text-xs text-muted">{POSTE_LABELS[p.candidature.posteSouhaite as PosteSouhaite] ?? p.candidature.posteSouhaite}</p>
                  </div>
                  {p.demande && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-dark">{p.demande.nomRaisonSociale}</p>
                      <p className="text-xs text-muted">Client</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Début : {new Date(p.dateDebut).toLocaleDateString('fr-FR')}
                  </span>
                  {p.dateFin && (
                    <span className="text-xs text-muted">Fin : {new Date(p.dateFin).toLocaleDateString('fr-FR')}</span>
                  )}
                  {p.salaire && (
                    <span className="text-xs text-accent font-medium">{p.salaire}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1 shrink-0 text-right">
                <Link to={`/admin/candidatures/${p.candidatureId}`} className="text-primary text-xs font-medium hover:underline">Fiche candidat</Link>
                {p.demandeId && <Link to={`/admin/demandes/${p.demandeId}`} className="text-accent text-xs font-medium hover:underline">Fiche client</Link>}
                <button onClick={() => setDeleteId(p.id)} className="text-red-500 text-xs hover:underline">Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.meta.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost disabled:opacity-40">←</button>
          <span className="text-sm text-muted">Page {page} / {data.meta.pages}</span>
          <button onClick={() => setPage(p => Math.min(data.meta.pages, p + 1))} disabled={page === data.meta.pages} className="btn-ghost disabled:opacity-40">→</button>
        </div>
      )}

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer le placement">
        <p className="text-muted mb-6">Ce placement sera supprimé (la candidature reste dans la base).</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-ghost">Annuler</button>
          <button onClick={confirmDelete} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm font-medium">Supprimer</button>
        </div>
      </Modal>
    </div>
  )
}

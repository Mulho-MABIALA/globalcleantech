import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useMessages, useDeleteMessage, useUpdateMessage, Message } from '../../hooks/useMessages'
import Modal from '../../components/ui/Modal'

const STATUT_LABELS: Record<string, string> = { non_lu: 'Non lu', lu: 'Lu', archive: 'Archivé' }
const STATUT_COLORS: Record<string, string> = {
  non_lu: 'bg-red-50 text-red-600 border border-red-100',
  lu: 'bg-blue-50 text-blue-600 border border-blue-100',
  archive: 'bg-gray-50 text-gray-500 border border-gray-100',
}

export default function Messages() {
  const [page, setPage] = useState(1)
  const [statut, setStatut] = useState('')
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data, isLoading } = useMessages({ page, statut, search, limit: 20 })
  const deleteMut = useDeleteMessage()
  const updateMut = useUpdateMessage()

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMut.mutateAsync(deleteId)
      toast.success('Message supprimé.')
      setDeleteId(null)
    } catch { toast.error('Erreur.') }
  }

  const archive = async (id: number) => {
    await updateMut.mutateAsync({ id, statut: 'archive' })
    toast.success('Archivé.')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-dark">Messages</h1>
          <p className="text-muted text-sm mt-1">{data?.meta.total ?? 0} message(s) au total</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="card flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="form-input flex-1" placeholder="Rechercher nom, email, sujet..." />
        <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1) }} className="form-input sm:w-44">
          <option value="">Tous les statuts</option>
          <option value="non_lu">Non lus</option>
          <option value="lu">Lus</option>
          <option value="archive">Archivés</option>
        </select>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="space-y-2">
          {data?.data.map((m: Message) => (
            <div
              key={m.id}
              className={`card flex items-start gap-4 hover:shadow-md transition-shadow ${m.statut === 'non_lu' ? 'border-l-4 border-l-primary' : ''}`}
            >
              {/* Indicateur non-lu */}
              <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${m.statut === 'non_lu' ? 'bg-primary' : 'bg-transparent'}`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className={`font-semibold text-dark ${m.statut === 'non_lu' ? 'font-bold' : ''}`}>{m.nom}</p>
                    <p className="text-xs text-muted">{m.email}{m.telephone ? ` · ${m.telephone}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUT_COLORS[m.statut]}`}>
                      {STATUT_LABELS[m.statut]}
                    </span>
                    <span className="text-xs text-muted whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-medium text-dark mt-1">{m.sujet}</p>
                <p className="text-sm text-muted mt-0.5 line-clamp-2">{m.corps}</p>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                <Link to={`/admin/messages/${m.id}`} className="text-primary text-xs font-medium hover:underline">Ouvrir</Link>
                {m.statut !== 'archive' && (
                  <button onClick={() => archive(m.id)} className="text-muted text-xs hover:underline">Archiver</button>
                )}
                <button onClick={() => setDeleteId(m.id)} className="text-red-500 text-xs hover:underline">Supprimer</button>
              </div>
            </div>
          ))}
          {data?.data.length === 0 && (
            <div className="card text-center py-12 text-muted">Aucun message trouvé.</div>
          )}
        </div>
      )}

      {data && data.meta.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost disabled:opacity-40">←</button>
          <span className="text-sm text-muted">Page {page} / {data.meta.pages}</span>
          <button onClick={() => setPage(p => Math.min(data.meta.pages, p + 1))} disabled={page === data.meta.pages} className="btn-ghost disabled:opacity-40">→</button>
        </div>
      )}

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer le message">
        <p className="text-muted mb-6">Ce message sera définitivement supprimé.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-ghost">Annuler</button>
          <button onClick={confirmDelete} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm font-medium">Supprimer</button>
        </div>
      </Modal>
    </div>
  )
}

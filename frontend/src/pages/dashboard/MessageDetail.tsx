import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useMessage, useUpdateMessage, useDeleteMessage } from '../../hooks/useMessages'
import Modal from '../../components/ui/Modal'

const STATUT_OPTIONS = [
  { value: 'non_lu', label: 'Non lu' },
  { value: 'lu', label: 'Lu' },
  { value: 'archive', label: 'Archivé' },
]

export default function MessageDetail() {
  const { id } = useParams<{ id: string }>()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [note, setNote] = useState('')

  const { data: msg, isLoading } = useMessage(parseInt(id!))
  const updateMut = useUpdateMessage()
  const deleteMut = useDeleteMessage()

  React.useEffect(() => { if (msg?.noteAdmin) setNote(msg.noteAdmin) }, [msg])

  if (isLoading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  if (!msg) return <div className="text-center py-20 text-muted">Message introuvable.</div>

  const handleStatut = async (statut: string) => {
    await updateMut.mutateAsync({ id: msg.id, statut })
    toast.success('Statut mis à jour.')
  }

  const handleNote = async () => {
    await updateMut.mutateAsync({ id: msg.id, noteAdmin: note })
    toast.success('Note enregistrée.')
  }

  const handleDelete = async () => {
    await deleteMut.mutateAsync(msg.id)
    toast.success('Message supprimé.')
    window.history.back()
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back */}
      <Link to="/admin/messages" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-dark transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Retour aux messages
      </Link>

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
          <div>
            <h1 className="text-xl font-bold font-display text-dark mb-1">{msg.sujet}</h1>
            <p className="text-sm text-muted">{new Date(msg.createdAt).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <select
            value={msg.statut}
            onChange={e => handleStatut(e.target.value)}
            className="form-input w-auto text-sm"
          >
            {STATUT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Expéditeur */}
        <div className="flex items-center gap-3 p-4 bg-surface rounded-xl mb-5">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
            {msg.nom[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-dark text-sm">{msg.nom}</p>
            <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
              <a href={`mailto:${msg.email}`} className="hover:text-primary transition-colors">{msg.email}</a>
              {msg.telephone && <span>· {msg.telephone}</span>}
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.sujet)}`} className="inline-flex items-center gap-1.5 text-xs text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary-light transition-colors font-medium">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
              Répondre par email
            </a>
          </div>
        </div>

        {/* Corps du message */}
        <div className="bg-gray-50 rounded-xl p-5 text-sm text-dark leading-relaxed whitespace-pre-wrap border border-gray-100">
          {msg.corps}
        </div>
      </div>

      {/* Notes admin */}
      <div className="card">
        <h3 className="font-semibold text-dark font-display mb-3">Notes internes</h3>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={4}
          className="form-input resize-none w-full mb-3"
          placeholder="Ajoutez vos notes de suivi ici..."
        />
        <button onClick={handleNote} disabled={updateMut.isPending} className="btn-primary text-sm py-2">
          {updateMut.isPending ? 'Enregistrement...' : 'Enregistrer la note'}
        </button>
      </div>

      {/* Danger zone */}
      <div className="card border border-red-100">
        <h3 className="font-semibold text-dark mb-2">Zone de danger</h3>
        <p className="text-sm text-muted mb-4">La suppression est définitive et irréversible.</p>
        <button onClick={() => setDeleteOpen(true)} className="text-red-500 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors">
          Supprimer ce message
        </button>
      </div>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Supprimer le message">
        <p className="text-muted mb-6">Ce message sera définitivement supprimé.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteOpen(false)} className="btn-ghost">Annuler</button>
          <button onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm font-medium">Supprimer</button>
        </div>
      </Modal>
    </div>
  )
}

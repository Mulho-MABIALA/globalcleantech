import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useCandidature, useUpdateCandidature, useDeleteCandidature } from '../../hooks/useCandidatures'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { POSTE_LABELS, EXPERIENCE_LABELS, STATUT_CANDIDATURE_LABELS } from '../../types/candidature'
import { api } from '../../services/api'

export default function CandidatureDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: c, isLoading } = useCandidature(Number(id))
  const updateMut = useUpdateCandidature()
  const deleteMut = useDeleteCandidature()

  const [statut, setStatut] = useState('')
  const [notes, setNotes] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  React.useEffect(() => {
    if (c) {
      setStatut(c.statut)
      setNotes(c.notesInternes || '')
    }
  }, [c])

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  if (!c) return <div className="text-center py-16 text-muted">Candidature introuvable.</div>

  const saveStatut = async () => {
    try {
      await updateMut.mutateAsync({ id: c.id, statut })
      toast.success('Statut mis à jour.')
    } catch { toast.error('Erreur.') }
  }

  const saveNotes = async () => {
    try {
      await updateMut.mutateAsync({ id: c.id, notesInternes: notes })
      toast.success('Notes enregistrées.')
    } catch { toast.error('Erreur.') }
  }

  const handleDelete = async () => {
    try {
      await deleteMut.mutateAsync(c.id)
      toast.success('Candidature supprimée.')
      navigate('/admin/candidatures')
    } catch { toast.error('Erreur.') }
  }

  const downloadFile = (filePath: string) => {
    const parts = filePath.replace(/\\/g, '/').split('/')
    if (parts.length < 2) return
    const folder = parts.slice(0, -1).join('/')
    const filename = parts[parts.length - 1]
    api.get(`/uploads/${folder}/${filename}`, { responseType: 'blob' }).then((res) => {
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    }).catch(() => toast.error('Fichier introuvable.'))
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/admin/candidatures" className="text-muted hover:text-dark text-sm">← Candidatures</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-dark font-medium">#{c.id} — {c.nomComplet}</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-dark">{c.nomComplet}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge status={c.statut} />
            <span className="text-sm text-muted">{POSTE_LABELS[c.posteSouhaite]}</span>
          </div>
        </div>
        <button onClick={() => setDeleteOpen(true)} className="text-red-500 text-sm hover:underline">Supprimer</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="font-semibold font-display text-dark mb-4">Informations personnelles</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Téléphone', c.telephone],
                ['Email', c.email || '—'],
                ['Ville', c.ville],
                ['Date de naissance', new Date(c.dateNaissance).toLocaleDateString('fr-FR')],
                ['Expérience', EXPERIENCE_LABELS[c.experience]],
                ['Disponibilité', c.disponibilite],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-medium text-dark mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {c.description && (
            <div className="card">
              <h2 className="font-semibold font-display text-dark mb-2">Description / Compétences</h2>
              <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{c.description}</p>
            </div>
          )}

          {(c.cvPath || c.photoPath || c.cniRectoPath || c.cniVersoPath) && (
            <div className="card">
              <h2 className="font-semibold font-display text-dark mb-4">Fichiers</h2>
              <div className="flex flex-wrap gap-3">
                {c.cvPath && (
                  <button
                    onClick={() => downloadFile(c.cvPath!)}
                    className="flex items-center gap-2 bg-primary-light text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Télécharger CV
                  </button>
                )}
                {c.photoPath && (
                  <button
                    onClick={() => downloadFile(c.photoPath!)}
                    className="flex items-center gap-2 bg-surface text-dark px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Voir photo
                  </button>
                )}
                {c.cniRectoPath && (
                  <button
                    onClick={() => downloadFile(c.cniRectoPath!)}
                    className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    CNI / Passeport (recto)
                  </button>
                )}
                {c.cniVersoPath && (
                  <button
                    onClick={() => downloadFile(c.cniVersoPath!)}
                    className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    CNI / Passeport (verso)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold font-display text-dark mb-3">Changer le statut</h2>
            <select value={statut} onChange={(e) => setStatut(e.target.value)} className="form-input mb-3">
              {Object.entries(STATUT_CANDIDATURE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <button onClick={saveStatut} disabled={updateMut.isPending} className="btn-primary w-full text-sm py-2">
              Enregistrer
            </button>
          </div>

          <div className="card">
            <h2 className="font-semibold font-display text-dark mb-3">Notes internes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="form-input resize-none text-sm mb-3"
              placeholder="Observations, suivis, remarques..."
            />
            <button onClick={saveNotes} disabled={updateMut.isPending} className="btn-outline w-full text-sm py-2">
              Sauvegarder les notes
            </button>
          </div>

          <div className="card text-xs text-muted space-y-1">
            <p>Reçue le {new Date(c.createdAt).toLocaleDateString('fr-FR')}</p>
            <p>Modifiée le {new Date(c.updatedAt).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      </div>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Confirmer la suppression">
        <p className="text-muted mb-6">Supprimer définitivement la candidature de <strong>{c.nomComplet}</strong> ?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteOpen(false)} className="btn-ghost">Annuler</button>
          <button onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600">Supprimer</button>
        </div>
      </Modal>
    </div>
  )
}

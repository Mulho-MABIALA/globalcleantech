import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useCandidature, useUpdateCandidature, useDeleteCandidature } from '../../hooks/useCandidatures'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EnvoyerAfficheModal from '../../components/dashboard/EnvoyerAfficheModal'
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
  const [afficheOpen, setAfficheOpen] = useState(false)

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

  const splitPath = (filePath: string) => {
    const parts = filePath.replace(/\\/g, '/').split('/')
    if (parts.length < 2) return null
    return { folder: parts.slice(0, -1).join('/'), filename: parts[parts.length - 1] }
  }

  const downloadFile = (filePath: string) => {
    const p = splitPath(filePath)
    if (!p) return
    api.get(`/uploads/${p.folder}/${p.filename}`, { responseType: 'blob' }).then((res) => {
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = p.filename
      a.click()
      URL.revokeObjectURL(url)
    }).catch(() => toast.error('Fichier introuvable.'))
  }

  // Les fichiers sont servis derrière l'auth (header Authorization), donc pas de
  // lien direct : on ouvre un onglet vide tout de suite (pour éviter le blocage
  // popup) puis on y charge le blob une fois récupéré.
  const viewFile = (filePath: string) => {
    const p = splitPath(filePath)
    if (!p) return
    const win = window.open('', '_blank')
    api.get(`/uploads/${p.folder}/${p.filename}`, { responseType: 'blob' }).then((res) => {
      const url = URL.createObjectURL(res.data)
      if (win) win.location.href = url
      else toast.error("Le navigateur a bloqué l'ouverture — autorisez les pop-ups pour ce site.")
    }).catch(() => {
      win?.close()
      toast.error('Fichier introuvable.')
    })
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
        <div className="flex items-center gap-4">
          <button onClick={() => setAfficheOpen(true)} className="flex items-center gap-2 text-primary text-sm font-medium hover:underline">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Envoyer l'affiche par email
          </button>
          <button onClick={() => setDeleteOpen(true)} className="text-red-500 text-sm hover:underline">Supprimer</button>
        </div>
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
              <div className="space-y-2">
                {[
                  { path: c.cvPath, label: 'CV', color: 'bg-primary-light text-primary' },
                  { path: c.photoPath, label: 'Photo', color: 'bg-surface text-dark' },
                  { path: c.cniRectoPath, label: 'CNI / Passeport (recto)', color: 'bg-amber-50 text-amber-700' },
                  { path: c.cniVersoPath, label: 'CNI / Passeport (verso)', color: 'bg-amber-50 text-amber-700' },
                ].filter((f) => f.path).map((f) => (
                  <div key={f.label} className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg ${f.color}`}>
                    <span className="text-sm font-medium">{f.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => viewFile(f.path!)}
                        className="flex items-center gap-1.5 bg-white/70 hover:bg-white px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Voir
                      </button>
                      <button
                        onClick={() => downloadFile(f.path!)}
                        className="flex items-center gap-1.5 bg-white/70 hover:bg-white px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Télécharger
                      </button>
                    </div>
                  </div>
                ))}
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

      <EnvoyerAfficheModal open={afficheOpen} onClose={() => setAfficheOpen(false)} candidature={c} />
    </div>
  )
}

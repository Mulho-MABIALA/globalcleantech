import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

interface Subscriber {
  id: number
  email: string
  actif: boolean
  createdAt: string
}

interface NewsletterResponse {
  data: Subscriber[]
  meta: { total: number; page: number; pages: number }
}

export default function Newsletter() {
  const [page, setPage] = useState(1)
  const [showInactif, setShowInactif] = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const [sujet, setSujet] = useState('')
  const [contenu, setContenu] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<NewsletterResponse>({
    queryKey: ['newsletter', page, showInactif],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/newsletter?page=${page}&actif=${!showInactif}`)
      return data
    },
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, actif }: { id: number; actif: boolean }) =>
      api.patch(`/dashboard/newsletter/${id}`, { actif }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['newsletter'] }); toast.success('Mis à jour.') },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/dashboard/newsletter/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['newsletter'] }); toast.success('Supprimé.') },
  })

  const sendMut = useMutation({
    mutationFn: () => api.post('/dashboard/newsletter/send', { sujet, contenu }),
    onSuccess: ({ data }) => {
      toast.success(data.message)
      setSujet(''); setContenu(''); setShowCompose(false)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? "Échec de l'envoi.")
    },
  })

  const handleSend = () => {
    if (!sujet.trim() || !contenu.trim()) { toast.error('Sujet et contenu requis.'); return }
    const total = data?.meta.total ?? 0
    if (window.confirm(`Envoyer cette newsletter à ${total} abonné(s) actif(s) ?`)) {
      sendMut.mutate()
    }
  }

  const exportCsv = () => {
    api.get('/dashboard/newsletter/export', { responseType: 'blob' }).then(res => {
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = 'newsletter.csv'; a.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black font-display text-dark">Newsletter</h1>
          <p className="text-muted text-sm mt-0.5">{data?.meta.total ?? 0} abonné(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInactif(!showInactif)}
            className={`text-sm px-3 py-2 rounded-lg border transition-colors ${showInactif ? 'border-primary text-primary bg-primary/5' : 'border-gray-200 text-muted hover:border-gray-300'}`}
          >
            {showInactif ? 'Afficher actifs' : 'Afficher désinscrits'}
          </button>
          <button onClick={exportCsv} className="btn-outline text-sm py-2">
            Export CSV
          </button>
          <button onClick={() => setShowCompose(!showCompose)} className="btn-primary text-sm py-2">
            {showCompose ? 'Fermer' : '✉️ Envoyer une newsletter'}
          </button>
        </div>
      </div>

      {showCompose && (
        <div className="card space-y-4">
          <div>
            <h2 className="font-bold text-dark">Nouvelle newsletter</h2>
            <p className="text-muted text-sm mt-0.5">
              Sera envoyée à tous les abonnés actifs. Un lien de désinscription est ajouté automatiquement en bas de l'email.
            </p>
          </div>
          <div>
            <label htmlFor="nl-sujet" className="form-label">Sujet *</label>
            <input
              id="nl-sujet"
              type="text"
              className="form-input"
              placeholder="Ex : Nouveaux profils disponibles ce mois-ci"
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              maxLength={150}
            />
          </div>
          <div>
            <label htmlFor="nl-contenu" className="form-label">Contenu *</label>
            <textarea
              id="nl-contenu"
              className="form-input min-h-[180px]"
              placeholder={'Bonjour,\n\nVoici les actualités de Global Clean Tech...'}
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
            />
            <p className="text-xs text-muted mt-1">Les retours à la ligne sont conservés dans l'email.</p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSend}
              disabled={sendMut.isPending}
              className="btn-primary text-sm py-2 disabled:opacity-50"
            >
              {sendMut.isPending ? 'Envoi en cours…' : `Envoyer à ${data?.meta.total ?? 0} abonné(s)`}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="card overflow-x-auto p-0">
          {data?.data.length === 0 ? (
            <div className="text-center py-16 text-muted">
              <div className="text-4xl mb-3">📧</div>
              <p className="font-medium">Aucun abonné</p>
              <p className="text-sm mt-1">Les inscriptions depuis le site apparaissent ici.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th className="hidden md:table-cell">Inscrit le</th>
                  <th>Statut</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data?.data.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium text-dark">{s.email}</td>
                    <td className="text-muted hidden md:table-cell whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${s.actif ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.actif ? 'Actif' : 'Désinscrit'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleMut.mutate({ id: s.id, actif: !s.actif })}
                          className="table-action"
                        >
                          {s.actif ? 'Désinscrire' : 'Réactiver'}
                        </button>
                        <button
                          onClick={() => deleteMut.mutate(s.id)}
                          className="table-action-danger"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  )
}

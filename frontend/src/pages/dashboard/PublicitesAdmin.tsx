import React, { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '../../services/api'
import Modal from '../../components/ui/Modal'
import { useMe, hasPermission } from '../../hooks/useMe'
import { Publicite, EmplacementPub, EMPLACEMENT_LABELS, siteImageUrl } from '../../hooks/usePublicites'

const EMPLACEMENTS: { val: EmplacementPub; label: string; hint: string }[] = [
  { val: 'accueil', label: EMPLACEMENT_LABELS.accueil, hint: 'Grand carrousel entre les sections de l\'accueil — idéal en 1600×700 px.' },
  { val: 'popup', label: EMPLACEMENT_LABELS.popup, hint: 'Fenêtre affichée une fois par visite. Seule la pub la mieux classée est montrée.' },
  { val: 'global', label: EMPLACEMENT_LABELS.global, hint: 'Petit bandeau au-dessus du pied de page, sur toutes les pages publiques.' },
]

type Form = {
  titre: string; description: string; annonceur: string; lien: string; texteBouton: string
  emplacement: EmplacementPub; dateDebut: string; dateFin: string; ordre: number; actif: boolean
}

const EMPTY: Form = {
  titre: '', description: '', annonceur: '', lien: '', texteBouton: '',
  emplacement: 'accueil', dateDebut: '', dateFin: '', ordre: 0, actif: true,
}

const toInputDate = (d: string | null) => (d ? d.slice(0, 10) : '')
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : null)

function statutDiffusion(p: Publicite): { label: string; cls: string } {
  const now = Date.now()
  if (!p.actif) return { label: 'Masquée', cls: 'bg-gray-100 text-gray-500' }
  if (p.dateDebut && new Date(p.dateDebut).getTime() > now) return { label: 'Programmée', cls: 'bg-blue-100 text-blue-700' }
  if (p.dateFin && new Date(p.dateFin).getTime() < now) return { label: 'Expirée', cls: 'bg-orange-100 text-orange-700' }
  return { label: 'En ligne', cls: 'bg-green-100 text-green-700' }
}

type ApiError = { response?: { data?: { message?: string } } }
const errMsg = (e: ApiError) => e.response?.data?.message ?? 'Une erreur est survenue.'

export default function PublicitesAdmin() {
  const qc = useQueryClient()
  const { data: me } = useMe()
  const canEdit = hasPermission(me, 'publicites', 'edit')

  const [filtre, setFiltre] = useState<EmplacementPub | 'toutes'>('toutes')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Publicite | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | undefined>()
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: items = [], isLoading } = useQuery<Publicite[]>({
    queryKey: ['admin-publicites'],
    queryFn: async () => (await api.get('/publicites')).data,
  })

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const inv = () => {
    qc.invalidateQueries({ queryKey: ['admin-publicites'] })
    qc.invalidateQueries({ queryKey: ['public-publicites'] })
  }

  const saveMut = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
      if (file) fd.append('image', file)
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } }
      return editing ? api.put(`/publicites/${editing.id}`, fd, cfg) : api.post('/publicites', fd, cfg)
    },
    onSuccess: () => { inv(); toast.success(editing ? 'Publicité mise à jour.' : 'Publicité créée.'); closeModal() },
    onError: (e: ApiError) => toast.error(errMsg(e)),
  })
  const toggleMut = useMutation({
    mutationFn: (p: Publicite) => api.patch(`/publicites/${p.id}/actif`, { actif: !p.actif }),
    onSuccess: inv,
    onError: (e: ApiError) => toast.error(errMsg(e)),
  })
  const resetMut = useMutation({
    mutationFn: (id: number) => api.patch(`/publicites/${id}/reset-stats`),
    onSuccess: () => { inv(); toast.success('Statistiques remises à zéro.') },
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/publicites/${id}`),
    onSuccess: () => { inv(); toast.success('Publicité supprimée.'); setDeleteId(null) },
    onError: (e: ApiError) => toast.error(errMsg(e)),
  })

  const openCreate = () => {
    setEditing(null); setForm({ ...EMPTY, emplacement: filtre === 'toutes' ? 'accueil' : filtre })
    setFile(null); setPreview(undefined); setModalOpen(true)
  }
  const openEdit = (p: Publicite) => {
    setEditing(p)
    setForm({
      titre: p.titre, description: p.description ?? '', annonceur: p.annonceur ?? '', lien: p.lien ?? '',
      texteBouton: p.texteBouton ?? '', emplacement: p.emplacement, dateDebut: toInputDate(p.dateDebut),
      dateFin: toInputDate(p.dateFin), ordre: p.ordre, actif: p.actif,
    })
    setFile(null); setPreview(siteImageUrl(p.imagePath)); setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditing(null); setFile(null) }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing && !file) { toast.error('Ajoutez une image pour la publicité.'); return }
    saveMut.mutate()
  }

  const onFile = (f?: File) => {
    if (!f) return
    if (f.size > 3 * 1024 * 1024) { toast.error('Image trop lourde (3 Mo maximum).'); return }
    setFile(f)
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }))

  const visibles = filtre === 'toutes' ? items : items.filter(p => p.emplacement === filtre)
  const totalVues = items.reduce((s, p) => s + p.vues, 0)
  const totalClics = items.reduce((s, p) => s + p.clics, 0)
  const enLigne = items.filter(p => statutDiffusion(p).label === 'En ligne').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black font-display text-dark">Espaces publicitaires</h1>
          <p className="text-muted text-sm mt-0.5">Bannières affichées sur le site public, avec suivi des vues et des clics</p>
        </div>
        {canEdit && <button onClick={openCreate} className="btn-primary text-sm py-2">+ Nouvelle publicité</button>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Publicités', val: items.length },
          { label: 'En ligne', val: enLigne },
          { label: 'Vues', val: totalVues.toLocaleString('fr-FR') },
          { label: 'Taux de clic', val: totalVues ? `${((totalClics / totalVues) * 100).toFixed(1)} %` : '—' },
        ].map(s => (
          <div key={s.label} className="card py-4">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="text-2xl font-black font-display text-dark mt-1">{s.val}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['toutes', ...EMPLACEMENTS.map(e => e.val)] as const).map(v => (
          <button key={v} onClick={() => setFiltre(v)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${filtre === v ? 'bg-primary text-white border-primary' : 'bg-white text-muted border-gray-200 hover:border-gray-300'}`}>
            {v === 'toutes' ? 'Toutes' : EMPLACEMENT_LABELS[v]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : visibles.length === 0 ? (
        <div className="card text-center py-14">
          <p className="font-semibold text-dark">Aucune publicité pour le moment</p>
          <p className="text-sm text-muted mt-1">Créez une bannière : elle apparaîtra automatiquement sur le site.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibles.map(p => {
            const st = statutDiffusion(p)
            const ctr = p.vues ? ((p.clics / p.vues) * 100).toFixed(1) : null
            const debut = fmt(p.dateDebut), fin = fmt(p.dateFin)
            return (
              <div key={p.id} className={`card flex flex-col sm:flex-row gap-4 ${p.actif ? '' : 'opacity-60'}`}>
                <div className="w-full sm:w-40 aspect-[16/9] rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {p.imagePath && <img src={siteImageUrl(p.imagePath)} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-dark font-display">{p.titre}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-light text-accent font-medium">{EMPLACEMENT_LABELS[p.emplacement]}</span>
                  </div>
                  {p.annonceur && <p className="text-xs text-muted mt-0.5">Annonceur : {p.annonceur}</p>}
                  {p.description && <p className="text-sm text-muted line-clamp-1 mt-1">{p.description}</p>}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted mt-2">
                    <span>👁 {p.vues.toLocaleString('fr-FR')} vues</span>
                    <span>🖱 {p.clics.toLocaleString('fr-FR')} clics</span>
                    {ctr && <span>📈 {ctr} %</span>}
                    {(debut || fin) && <span>📅 {debut ?? '…'} → {fin ?? 'sans fin'}</span>}
                    {p.lien && <a href={p.lien} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[220px]">{p.lien}</a>}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex sm:flex-col gap-3 sm:gap-1 shrink-0 sm:items-end">
                    <button onClick={() => openEdit(p)} className="text-xs text-primary hover:underline">Modifier</button>
                    <button onClick={() => toggleMut.mutate(p)} className="text-xs text-muted hover:underline">{p.actif ? 'Masquer' : 'Afficher'}</button>
                    <button onClick={() => resetMut.mutate(p.id)} className="text-xs text-muted hover:underline">Réinit. stats</button>
                    <button onClick={() => setDeleteId(p.id)} className="text-xs text-red-500 hover:underline">Supprimer</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Modifier la publicité' : 'Nouvelle publicité'} maxWidth="xl">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="form-label">Emplacement *</label>
            <div className="grid sm:grid-cols-3 gap-2 mt-1">
              {EMPLACEMENTS.map(e => (
                <button key={e.val} type="button" onClick={() => set('emplacement', e.val)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${form.emplacement === e.val ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200 bg-surface'}`}>
                  <p className="text-sm font-semibold text-dark">{e.label}</p>
                  <p className="text-[11px] text-muted mt-0.5 leading-snug">{e.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Visuel {editing ? '' : '*'} <span className="text-muted font-normal">(JPG, PNG ou WEBP — 3 Mo max)</span></label>
            <label className="mt-1 flex items-center gap-4 p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary cursor-pointer bg-surface">
              <div className="w-32 aspect-[16/9] rounded-lg overflow-hidden bg-gray-200 shrink-0">
                {preview && <img src={preview} alt="" className="w-full h-full object-cover" />}
              </div>
              <span className="text-sm text-muted">{file ? file.name : preview ? 'Cliquer pour remplacer l\'image' : 'Cliquer pour choisir une image'}</span>
              <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="form-label">Titre *</label><input required maxLength={150} value={form.titre} onChange={e => set('titre', e.target.value)} className="form-input" /></div>
            <div><label className="form-label">Annonceur</label><input maxLength={150} value={form.annonceur} onChange={e => set('annonceur', e.target.value)} className="form-input" placeholder="Ex : Boulangerie du Plateau" /></div>
          </div>
          <div><label className="form-label">Texte</label><textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} className="form-input resize-none" /></div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="form-label">Lien</label><input value={form.lien} onChange={e => set('lien', e.target.value)} className="form-input" placeholder="https://... ou /contact" /></div>
            <div><label className="form-label">Texte du bouton</label><input maxLength={50} value={form.texteBouton} onChange={e => set('texteBouton', e.target.value)} className="form-input" placeholder="En savoir plus" /></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><label className="form-label">Début de diffusion</label><input type="date" value={form.dateDebut} onChange={e => set('dateDebut', e.target.value)} className="form-input" /></div>
            <div><label className="form-label">Fin de diffusion</label><input type="date" value={form.dateFin} min={form.dateDebut || undefined} onChange={e => set('dateFin', e.target.value)} className="form-input" /></div>
            <div><label className="form-label">Ordre</label><input type="number" min={0} value={form.ordre} onChange={e => set('ordre', Number(e.target.value))} className="form-input" /></div>
          </div>
          <p className="text-xs text-muted -mt-2">Laissez les dates vides pour une diffusion sans limite.</p>

          <label className="flex items-center gap-2 text-sm text-dark cursor-pointer">
            <input type="checkbox" checked={form.actif} onChange={e => set('actif', e.target.checked)} className="w-4 h-4 accent-primary" />
            Publiée (visible sur le site)
          </label>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={closeModal} className="btn-ghost">Annuler</button>
            <button type="submit" className="btn-primary" disabled={saveMut.isPending}>{saveMut.isPending ? 'Envoi…' : editing ? 'Enregistrer' : 'Créer'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer la publicité">
        <p className="text-muted mb-6">La publicité et son image seront définitivement supprimées.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-ghost">Annuler</button>
          <button onClick={() => deleteId && deleteMut.mutate(deleteId)} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm font-medium">Supprimer</button>
        </div>
      </Modal>
    </div>
  )
}

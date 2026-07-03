import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import { ICON_MAP } from '../../components/sections/Services'

interface Actualite {
  id: number; titre: string; description: string; categorie: string
  couleur: string; icone: string; lien?: string | null; ordre: number; actif: boolean
}

const COULEURS = [
  { val: 'emerald', cls: 'bg-emerald-500' }, { val: 'blue', cls: 'bg-blue-500' },
  { val: 'purple', cls: 'bg-purple-500' }, { val: 'amber', cls: 'bg-amber-500' },
  { val: 'rose', cls: 'bg-rose-500' }, { val: 'teal', cls: 'bg-teal-500' },
  { val: 'indigo', cls: 'bg-indigo-500' }, { val: 'orange', cls: 'bg-orange-500' },
]

const ICON_LABELS: Record<string, string> = {
  users: 'Personnes', megaphone: 'Annonce', printer: 'Impression', money: 'Argent',
  clipboard: 'Document', star: 'Étoile', home: 'Maison', briefcase: 'Mallette',
  settings: 'Réglages', phone: 'Téléphone', shield: 'Sécurité', zap: 'Rapide',
}
const ICONS = Object.keys(ICON_MAP)

const EMPTY = { titre: '', description: '', categorie: '', couleur: 'emerald', icone: 'star', lien: '', ordre: 0 }

export default function ActualitesAdmin() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Actualite | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: items = [], isLoading } = useQuery<Actualite[]>({
    queryKey: ['admin-actualites'],
    queryFn: async () => { const { data } = await api.get('/dashboard/actualites'); return data },
  })

  const inv = () => {
    qc.invalidateQueries({ queryKey: ['admin-actualites'] })
    qc.invalidateQueries({ queryKey: ['public-actualites'] })
  }

  const createMut = useMutation({ mutationFn: (d: typeof EMPTY) => api.post('/dashboard/actualites', d), onSuccess: () => { inv(); toast.success('Créé.'); closeModal() } })
  const updateMut = useMutation({ mutationFn: ({ id, ...d }: Actualite) => api.put(`/dashboard/actualites/${id}`, d), onSuccess: () => { inv(); toast.success('Mis à jour.'); closeModal() } })
  const toggleMut = useMutation({ mutationFn: (a: Actualite) => api.put(`/dashboard/actualites/${a.id}`, { ...a, actif: !a.actif }), onSuccess: inv })
  const deleteMut = useMutation({ mutationFn: (id: number) => api.delete(`/dashboard/actualites/${id}`), onSuccess: () => { inv(); toast.success('Supprimé.'); setDeleteId(null) } })

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  const openEdit = (a: Actualite) => { setEditing(a); setForm({ titre: a.titre, description: a.description, categorie: a.categorie, couleur: a.couleur, icone: a.icone, lien: a.lien ?? '', ordre: a.ordre }); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditing(null) }
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (editing) updateMut.mutate({ ...editing, ...form }); else createMut.mutate(form) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black font-display text-dark">Actualités & Conseils</h1>
          <p className="text-muted text-sm mt-0.5">Cartes du carrousel sur la page Contact</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm py-2">+ Nouvelle carte</button>
      </div>

      {isLoading ? <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div> : (
        <div className="space-y-3">
          {items.map(a => {
            const icon = ICON_MAP[a.icone] ?? ICON_MAP.star
            return (
              <div key={a.id} className={`card flex items-start gap-4 transition-opacity ${a.actif ? '' : 'opacity-50'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-${a.couleur}-50 text-${a.couleur}-600`}>
                  <span className="w-5 h-5">{icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-dark font-display">{a.titre}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${a.couleur}-100 text-${a.couleur}-700`}>{a.categorie}</span>
                    {!a.actif && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Masqué</span>}
                  </div>
                  <p className="text-sm text-muted line-clamp-1">{a.description}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0 items-end">
                  <button onClick={() => openEdit(a)} className="text-xs text-primary hover:underline">Modifier</button>
                  <button onClick={() => toggleMut.mutate(a)} className="text-xs text-muted hover:underline">{a.actif ? 'Masquer' : 'Afficher'}</button>
                  <button onClick={() => setDeleteId(a.id)} className="text-xs text-red-500 hover:underline">Supprimer</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Modifier la carte' : 'Nouvelle carte'}>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="form-label">Titre *</label><input required value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} className="form-input" /></div>
          <div><label className="form-label">Description *</label><textarea rows={2} required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="form-input resize-none" /></div>
          <div><label className="form-label">Catégorie *</label><input required value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} className="form-input" placeholder="Ex: Conseils emploi" /></div>
          <div><label className="form-label">Lien (optionnel)</label><input type="url" value={form.lien ?? ''} onChange={e => setForm(f => ({ ...f, lien: e.target.value }))} className="form-input" placeholder="https://..." /></div>

          <div>
            <label className="form-label">Icône</label>
            <div className="grid grid-cols-6 gap-1.5 mt-1">
              {ICONS.map(key => (
                <button key={key} type="button" title={ICON_LABELS[key]} onClick={() => setForm(f => ({ ...f, icone: key }))}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${form.icone === key ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200 bg-surface'}`}>
                  <span className={`w-4 h-4 ${form.icone === key ? 'text-primary' : 'text-muted'}`}>{ICON_MAP[key]}</span>
                  <span className="text-[8px] text-muted truncate w-full text-center">{ICON_LABELS[key]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Couleur</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {COULEURS.map(c => (
                  <button key={c.val} type="button" onClick={() => setForm(f => ({ ...f, couleur: c.val }))}
                    className={`w-6 h-6 rounded-full ${c.cls} ${form.couleur === c.val ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'opacity-50 hover:opacity-100'}`} />
                ))}
              </div>
            </div>
            <div><label className="form-label">Ordre</label><input type="number" value={form.ordre} min={0} onChange={e => setForm(f => ({ ...f, ordre: Number(e.target.value) }))} className="form-input" /></div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={closeModal} className="btn-ghost">Annuler</button>
            <button type="submit" className="btn-primary" disabled={createMut.isPending || updateMut.isPending}>{editing ? 'Enregistrer' : 'Créer'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer la carte">
        <p className="text-muted mb-6">Cette carte sera retirée du carrousel.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-ghost">Annuler</button>
          <button onClick={() => deleteId && deleteMut.mutate(deleteId)} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm font-medium">Supprimer</button>
        </div>
      </Modal>
    </div>
  )
}

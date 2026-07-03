import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import { ICON_MAP } from '../../components/sections/Services'

interface Service {
  id: number
  titre: string
  description: string
  emoji: string
  couleur: string
  tags: string
  ordre: number
  actif: boolean
}

const COULEURS = [
  { val: 'emerald', label: 'Vert',   cls: 'bg-emerald-500' },
  { val: 'blue',    label: 'Bleu',   cls: 'bg-blue-500' },
  { val: 'purple',  label: 'Violet', cls: 'bg-purple-500' },
  { val: 'amber',   label: 'Jaune',  cls: 'bg-amber-500' },
  { val: 'rose',    label: 'Rose',   cls: 'bg-rose-500' },
  { val: 'teal',    label: 'Teal',   cls: 'bg-teal-500' },
  { val: 'indigo',  label: 'Indigo', cls: 'bg-indigo-500' },
  { val: 'orange',  label: 'Orange', cls: 'bg-orange-500' },
  { val: 'pink',    label: 'Pink',   cls: 'bg-pink-500' },
]

const ICON_LABELS: Record<string, string> = {
  users: 'Personnes', megaphone: 'Annonce', printer: 'Impression', money: 'Argent',
  clipboard: 'Document', star: 'Étoile', home: 'Maison', briefcase: 'Mallette',
  settings: 'Réglages', phone: 'Téléphone', shield: 'Sécurité', zap: 'Rapide',
}

const ICONS = Object.keys(ICON_MAP)

const EMPTY: Omit<Service, 'id' | 'actif'> = {
  titre: '', description: '', emoji: 'star', couleur: 'emerald', tags: '', ordre: 0,
}

export default function ServicesAdmin() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ['admin-services'],
    queryFn: async () => { const { data } = await api.get('/dashboard/services'); return data },
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-services'] })
    qc.invalidateQueries({ queryKey: ['public-services'] })
  }

  const createMut = useMutation({
    mutationFn: (d: typeof EMPTY) => api.post('/dashboard/services', d),
    onSuccess: () => { invalidate(); toast.success('Service créé.'); closeModal() },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, ...d }: Service) => api.put(`/dashboard/services/${id}`, d),
    onSuccess: () => { invalidate(); toast.success('Service mis à jour.'); closeModal() },
  })
  const toggleMut = useMutation({
    mutationFn: (s: Service) => api.put(`/dashboard/services/${s.id}`, { ...s, actif: !s.actif }),
    onSuccess: () => invalidate(),
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/dashboard/services/${id}`),
    onSuccess: () => { invalidate(); toast.success('Supprimé.'); setDeleteId(null) },
  })

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  const openEdit = (s: Service) => {
    setEditing(s)
    setForm({ titre: s.titre, description: s.description, emoji: s.emoji, couleur: s.couleur, tags: s.tags, ordre: s.ordre })
    setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) updateMut.mutate({ ...editing, ...form })
    else createMut.mutate(form)
  }

  const moveOrder = async (s: Service, dir: -1 | 1) => {
    await api.put(`/dashboard/services/${s.id}`, { ...s, ordre: s.ordre + dir })
    invalidate()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black font-display text-dark">Services</h1>
          <p className="text-muted text-sm mt-0.5">{services.length} service(s) — gérez l'ordre, le texte et l'icône</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm py-2">+ Nouveau service</button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="space-y-3">
          {services.map((s) => {
            const tags = s.tags.split(',').map(t => t.trim()).filter(Boolean)
            const icon = ICON_MAP[s.emoji] ?? ICON_MAP.star
            return (
              <div key={s.id} className={`card flex items-start gap-4 transition-opacity ${s.actif ? '' : 'opacity-50'}`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-${s.couleur}-50 text-${s.couleur}-600`}>
                  <span className="w-5 h-5">{icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-semibold text-dark font-display">{s.titre}</p>
                    {!s.actif && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Masqué</span>}
                  </div>
                  <p className="text-sm text-muted mb-2 line-clamp-1">{s.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {tags.map(t => (
                      <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface text-muted border border-gray-100">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0 items-end">
                  <div className="flex items-center gap-1 mb-1">
                    <button onClick={() => moveOrder(s, -1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface text-muted">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <span className="text-xs text-gray-400 w-4 text-center">{s.ordre}</span>
                    <button onClick={() => moveOrder(s, 1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface text-muted">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                  <button onClick={() => openEdit(s)} className="text-xs text-primary hover:underline">Modifier</button>
                  <button onClick={() => toggleMut.mutate(s)} className="text-xs text-muted hover:underline">
                    {s.actif ? 'Masquer' : 'Afficher'}
                  </button>
                  <button onClick={() => setDeleteId(s.id)} className="text-xs text-red-500 hover:underline">Supprimer</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Modifier le service' : 'Nouveau service'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Titre */}
          <div>
            <label className="form-label">Titre *</label>
            <input type="text" required value={form.titre}
              onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
              className="form-input" placeholder="Ex: Placement de personnel" />
          </div>

          {/* Description */}
          <div>
            <label className="form-label">Description *</label>
            <textarea rows={3} required value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="form-input resize-none" placeholder="Décrivez ce service en 1-2 phrases" />
          </div>

          {/* Tags */}
          <div>
            <label className="form-label">Tags <span className="text-gray-400 font-normal">(séparés par des virgules)</span></label>
            <input type="text" value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              className="form-input" placeholder="Ex: Maison,Bureau,Entreprise" />
          </div>

          {/* Icône */}
          <div>
            <label className="form-label">Icône</label>
            <div className="grid grid-cols-6 gap-2 mt-1">
              {ICONS.map(key => (
                <button key={key} type="button" title={ICON_LABELS[key] ?? key}
                  onClick={() => setForm(f => ({ ...f, emoji: key }))}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${form.emoji === key ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200 bg-surface'}`}
                >
                  <span className={`w-5 h-5 ${form.emoji === key ? 'text-primary' : 'text-muted'}`}>{ICON_MAP[key]}</span>
                  <span className="text-[9px] text-muted leading-none truncate w-full text-center">{ICON_LABELS[key]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Couleur + Ordre */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Couleur</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {COULEURS.map(c => (
                  <button key={c.val} type="button" title={c.label}
                    onClick={() => setForm(f => ({ ...f, couleur: c.val }))}
                    className={`w-7 h-7 rounded-full ${c.cls} transition-all ${form.couleur === c.val ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'opacity-50 hover:opacity-100'}`}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="form-label">Ordre</label>
              <input type="number" value={form.ordre} min={0}
                onChange={e => setForm(f => ({ ...f, ordre: Number(e.target.value) }))}
                className="form-input" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={closeModal} className="btn-ghost">Annuler</button>
            <button type="submit" className="btn-primary" disabled={createMut.isPending || updateMut.isPending}>
              {editing ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer le service">
        <p className="text-muted mb-6">Ce service sera supprimé du site public.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-ghost">Annuler</button>
          <button onClick={() => deleteId && deleteMut.mutate(deleteId)}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm font-medium">
            Supprimer
          </button>
        </div>
      </Modal>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useTemoignagesAdmin, useCreateTemoignage, useUpdateTemoignage, useDeleteTemoignage, Temoignage } from '../../hooks/useTemoignages'
import Modal from '../../components/ui/Modal'

const schema = z.object({
  nom: z.string().min(2, 'Requis'),
  role: z.string().min(2, 'Requis'),
  texte: z.string().min(10, 'Minimum 10 caractères'),
  note: z.number().int().min(1).max(5),
  actif: z.boolean(),
  ordre: z.number().int(),
})
type FormData = z.infer<typeof schema>

function Stars({ note, onChange }: { note: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          className={`text-xl transition-transform hover:scale-110 ${onChange ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <svg className={`w-5 h-5 ${i <= note ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

export default function Temoignages() {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Temoignage | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: temoignages = [], isLoading } = useTemoignagesAdmin()
  const createMut = useCreateTemoignage()
  const updateMut = useUpdateTemoignage()
  const deleteMut = useDeleteTemoignage()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { note: 5, actif: true, ordre: 0 },
  })
  const noteVal = watch('note')

  useEffect(() => {
    if (editing) {
      reset({ nom: editing.nom, role: editing.role, texte: editing.texte, note: editing.note, actif: editing.actif, ordre: editing.ordre })
    } else {
      reset({ note: 5, actif: true, ordre: (temoignages.length + 1) })
    }
  }, [editing, formOpen])

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...data })
        toast.success('Témoignage mis à jour.')
      } else {
        await createMut.mutateAsync(data)
        toast.success('Témoignage ajouté.')
      }
      setFormOpen(false)
      setEditing(null)
    } catch { toast.error('Erreur.') }
  }

  const handleToggle = async (t: Temoignage) => {
    await updateMut.mutateAsync({ id: t.id, actif: !t.actif })
    toast.success(t.actif ? 'Masqué du site.' : 'Affiché sur le site.')
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    await deleteMut.mutateAsync(deleteId)
    toast.success('Supprimé.')
    setDeleteId(null)
  }

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (t: Temoignage) => { setEditing(t); setFormOpen(true) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-dark">Témoignages</h1>
          <p className="text-muted text-sm mt-1">{temoignages.length} témoignage(s) — affichés dynamiquement sur le site</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm py-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Nouveau témoignage
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {temoignages.map(t => (
            <div key={t.id} className={`card flex flex-col gap-3 border-2 transition-colors ${t.actif ? 'border-primary/10' : 'border-gray-100 opacity-60'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                    {t.nom[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-dark">{t.nom}</p>
                    <p className="text-xs text-muted">{t.role}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.actif ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-muted'}`}>
                  {t.actif ? 'Affiché' : 'Masqué'}
                </span>
              </div>

              <Stars note={t.note} />

              <p className="text-sm text-muted leading-relaxed line-clamp-3 italic">"{t.texte}"</p>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-50 mt-auto">
                <button onClick={() => openEdit(t)} className="text-primary text-xs font-medium hover:underline">Modifier</button>
                <button onClick={() => handleToggle(t)} className="text-muted text-xs hover:underline">
                  {t.actif ? 'Masquer' : 'Afficher'}
                </button>
                <button onClick={() => setDeleteId(t.id)} className="text-red-500 text-xs hover:underline ml-auto">Supprimer</button>
              </div>
            </div>
          ))}

          {temoignages.length === 0 && (
            <div className="col-span-full card text-center py-12 text-muted">
              Aucun témoignage. Ajoutez-en un pour qu'il apparaisse sur le site.
            </div>
          )}
        </div>
      )}

      {/* Modal formulaire */}
      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }} title={editing ? 'Modifier le témoignage' : 'Nouveau témoignage'} maxWidth="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nom *</label>
              <input {...register('nom')} className={`form-input ${errors.nom ? 'border-red-400' : ''}`} placeholder="Fatou Diallo" />
              {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom.message}</p>}
            </div>
            <div>
              <label className="form-label">Rôle / Titre *</label>
              <input {...register('role')} className={`form-input ${errors.role ? 'border-red-400' : ''}`} placeholder="Particulier — Thiès" />
              {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
            </div>
          </div>

          <div>
            <label className="form-label">Témoignage *</label>
            <textarea {...register('texte')} rows={4} className={`form-input resize-none ${errors.texte ? 'border-red-400' : ''}`} placeholder="Le témoignage complet du client..." />
            {errors.texte && <p className="text-red-500 text-xs mt-1">{errors.texte.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <div>
              <label className="form-label">Note</label>
              <Stars note={noteVal} onChange={n => setValue('note', n)} />
            </div>
            <div>
              <label className="form-label">Ordre d'affichage</label>
              <input type="number" min="0" {...register('ordre', { valueAsNumber: true })} className="form-input" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="actif" {...register('actif')} className="w-4 h-4 accent-primary" />
              <label htmlFor="actif" className="text-sm font-medium text-dark cursor-pointer">Affiché sur le site</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => { setFormOpen(false); setEditing(null) }} className="btn-ghost">Annuler</button>
            <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="btn-primary">
              {createMut.isPending || updateMut.isPending ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal suppression */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer le témoignage">
        <p className="text-muted mb-6">Ce témoignage sera définitivement supprimé et retiré du site.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-ghost">Annuler</button>
          <button onClick={confirmDelete} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm font-medium">Supprimer</button>
        </div>
      </Modal>
    </div>
  )
}

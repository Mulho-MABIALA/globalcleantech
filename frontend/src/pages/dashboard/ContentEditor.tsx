import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { usePublicStats } from '../../hooks/usePublicStats'
import toast from 'react-hot-toast'

interface SiteContent {
  id: number
  cle: string
  valeur: string
  updatedAt: string
}

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=800&q=80'

// Ces deux stats sont calculées automatiquement à partir des vraies données
// (candidatures placées, demandes clôturées) — elles ne sont plus modifiables à la main.
const STATS_FIELDS = [
  { cle: 'about_stat_annees', label: "Années d'expérience" },
  { cle: 'about_stat_services', label: 'Services proposés' },
]

const VALEURS_FIELDS = [
  { titreCle: 'about_valeur_1_titre', descCle: 'about_valeur_1_desc', emoji: '🛡️', cardClass: 'border-emerald-100 bg-emerald-50/40' },
  { titreCle: 'about_valeur_2_titre', descCle: 'about_valeur_2_desc', emoji: '⭐', cardClass: 'border-amber-100 bg-amber-50/40' },
  { titreCle: 'about_valeur_3_titre', descCle: 'about_valeur_3_desc', emoji: '🤝', cardClass: 'border-blue-100 bg-blue-50/40' },
]

function EditableField({
  label, value, dirty, onChange, onSave, multiline, rows = 3, inputClassName = '',
}: {
  label: string
  value: string
  dirty: boolean
  onChange: (v: string) => void
  onSave: () => void
  multiline?: boolean
  rows?: number
  inputClassName?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</label>
        {dirty && (
          <button type="button" onClick={onSave} className="text-[11px] text-primary font-semibold hover:underline">
            Sauvegarder
          </button>
        )}
      </div>
      {multiline ? (
        <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} className={`form-input resize-y ${inputClassName}`} />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} className={`form-input ${inputClassName}`} />
      )}
    </div>
  )
}

export default function ContentEditor() {
  const qc = useQueryClient()
  const [values, setValues] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: contents, isLoading } = useQuery<SiteContent[]>({
    queryKey: ['site-content'],
    queryFn: async () => { const { data } = await api.get('/dashboard/content'); return data },
  })

  const { data: publicStats } = usePublicStats()

  useEffect(() => {
    if (contents) {
      const map: Record<string, string> = {}
      contents.forEach(c => { map[c.cle] = c.valeur })
      setValues(map)
    }
  }, [contents])

  const saveMut = useMutation({
    mutationFn: ({ cle, valeur }: { cle: string; valeur: string }) =>
      api.put(`/dashboard/content/${cle}`, { valeur }),
    onSuccess: (_, { cle }) => {
      setDirty(prev => { const s = new Set(prev); s.delete(cle); return s })
      qc.invalidateQueries({ queryKey: ['site-content'] })
      qc.invalidateQueries({ queryKey: ['public-content'] })
    },
  })

  const photoMut = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('photo', file)
      return api.post('/dashboard/content/about-photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['site-content'] })
      qc.invalidateQueries({ queryKey: ['public-content'] })
      toast.success('Photo mise à jour !')
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message ?? "Erreur lors de l'envoi de la photo."),
    onSettled: () => setUploading(false),
  })

  const handleChange = (cle: string, val: string) => {
    setValues(prev => ({ ...prev, [cle]: val }))
    setDirty(prev => new Set(prev).add(cle))
  }

  const handleSave = async (cle: string) => {
    await saveMut.mutateAsync({ cle, valeur: values[cle] ?? '' })
    toast.success('Sauvegardé !')
  }

  const saveAll = async () => {
    await Promise.all(Array.from(dirty).map(cle => saveMut.mutateAsync({ cle, valeur: values[cle] ?? '' })))
    toast.success('Tout sauvegardé !')
  }

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    photoMut.mutate(file)
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  const photoUrl = values.about_photo ? `/api/public/site-images/${values.about_photo}` : FALLBACK_PHOTO

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black font-display text-dark">Contenu du site</h1>
          <p className="text-muted text-sm mt-0.5">Cet aperçu suit l'ordre de la page « À propos » publique. Modifiez un champ, les changements sont visibles immédiatement sur le site.</p>
        </div>
        {dirty.size > 0 && (
          <button onClick={saveAll} className="btn-primary text-sm py-2">
            Sauvegarder tout ({dirty.size})
          </button>
        )}
      </div>

      {/* ── Bannière ── */}
      <div className="card !p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-dark via-[#0d2318] to-dark text-white p-6 sm:p-8 text-center">
          <span className="inline-flex items-center gap-2 bg-primary/15 border border-primary/25 text-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />À propos
          </span>
          <h2 className="text-xl sm:text-2xl font-black font-display leading-tight">
            Global Clean Tech, <span className="text-primary italic">au cœur de Thiès</span>
          </h2>
          <p className="text-white/40 text-[11px] mt-1 mb-4">(titre fixe — non modifiable ici)</p>
          <div className="max-w-md mx-auto text-left">
            <EditableField
              label="Sous-titre de la bannière"
              value={values.about_titre ?? ''}
              dirty={dirty.has('about_titre')}
              onChange={v => handleChange('about_titre', v)}
              onSave={() => handleSave('about_titre')}
              inputClassName="!bg-white/10 !border-white/20 !text-white placeholder:!text-white/40"
            />
          </div>
        </div>
      </div>

      {/* ── Statistiques ── */}
      <div className="card space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h2 className="font-bold font-display text-dark">Statistiques</h2>
          <p className="text-xs text-muted mt-0.5">Placements réalisés et clients fidèles se comptent automatiquement à partir des vraies données — plus besoin de les saisir à la main.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted">Placements réalisés</label>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">Auto</span>
            </div>
            <div className="form-input !bg-gray-50 text-center font-black text-primary select-none">{publicStats?.placements ?? 0}+</div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted">Clients fidèles</label>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">Auto</span>
            </div>
            <div className="form-input !bg-gray-50 text-center font-black text-primary select-none">{publicStats?.clients ?? 0}+</div>
          </div>
          {STATS_FIELDS.map(f => (
            <EditableField
              key={f.cle}
              label={f.label}
              value={values[f.cle] ?? ''}
              dirty={dirty.has(f.cle)}
              onChange={v => handleChange(f.cle, v)}
              onSave={() => handleSave(f.cle)}
              inputClassName="text-center font-black text-primary"
            />
          ))}
        </div>
      </div>

      {/* ── Notre histoire + photo ── */}
      <div className="card space-y-4">
        <h2 className="font-bold font-display text-dark border-b border-gray-100 pb-3">Notre histoire</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <EditableField
              label="Titre de la section"
              value={values.about_histoire_titre ?? ''}
              dirty={dirty.has('about_histoire_titre')}
              onChange={v => handleChange('about_histoire_titre', v)}
              onSave={() => handleSave('about_histoire_titre')}
            />
            <EditableField
              label="Paragraphe 1"
              value={values.about_histoire_p1 ?? ''}
              dirty={dirty.has('about_histoire_p1')}
              onChange={v => handleChange('about_histoire_p1', v)}
              onSave={() => handleSave('about_histoire_p1')}
              multiline
            />
            <EditableField
              label="Paragraphe 2"
              value={values.about_histoire_p2 ?? ''}
              dirty={dirty.has('about_histoire_p2')}
              onChange={v => handleChange('about_histoire_p2', v)}
              onSave={() => handleSave('about_histoire_p2')}
              multiline
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1 block">Photo (page À propos)</label>
            <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-[4/3] bg-gray-100">
              <img src={photoUrl} alt="Aperçu photo À propos" className="w-full h-full object-cover" />
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handlePhotoPick} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-ghost text-sm mt-3 w-full"
            >
              {uploading ? 'Envoi...' : 'Changer la photo'}
            </button>
            <p className="text-[10px] text-gray-400 mt-1">JPG, PNG ou WEBP, 2 Mo max.</p>
          </div>
        </div>
      </div>

      {/* ── Valeurs ── */}
      <div className="card space-y-4">
        <h2 className="font-bold font-display text-dark border-b border-gray-100 pb-3">Nos valeurs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {VALEURS_FIELDS.map((v, i) => (
            <div key={v.titreCle} className={`border ${v.cardClass} rounded-2xl p-4 space-y-3`}>
              <span className="text-2xl">{v.emoji}</span>
              <EditableField
                label={`Valeur ${i + 1} — Titre`}
                value={values[v.titreCle] ?? ''}
                dirty={dirty.has(v.titreCle)}
                onChange={val => handleChange(v.titreCle, val)}
                onSave={() => handleSave(v.titreCle)}
              />
              <EditableField
                label="Description"
                value={values[v.descCle] ?? ''}
                dirty={dirty.has(v.descCle)}
                onChange={val => handleChange(v.descCle, val)}
                onSave={() => handleSave(v.descCle)}
                multiline
                rows={2}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

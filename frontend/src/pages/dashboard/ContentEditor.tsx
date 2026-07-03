import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

interface SiteContent {
  id: number
  cle: string
  valeur: string
  updatedAt: string
}

const SECTIONS = [
  {
    titre: 'Page À propos — En-tête',
    champs: [
      { cle: 'about_titre', label: 'Sous-titre hero' },
    ],
  },
  {
    titre: 'Notre histoire',
    champs: [
      { cle: 'about_histoire_titre', label: 'Titre section' },
      { cle: 'about_histoire_p1', label: 'Paragraphe 1', multiline: true },
      { cle: 'about_histoire_p2', label: 'Paragraphe 2', multiline: true },
    ],
  },
  {
    titre: 'Statistiques',
    champs: [
      { cle: 'about_stat_placements', label: 'Placements (ex: 500+)' },
      { cle: 'about_stat_clients', label: 'Clients (ex: 150+)' },
      { cle: 'about_stat_annees', label: "Années d'expérience (ex: 5+)" },
      { cle: 'about_stat_services', label: 'Nombre de services (ex: 6)' },
    ],
  },
  {
    titre: 'Valeur 1',
    champs: [
      { cle: 'about_valeur_1_titre', label: 'Titre' },
      { cle: 'about_valeur_1_desc', label: 'Description', multiline: true },
    ],
  },
  {
    titre: 'Valeur 2',
    champs: [
      { cle: 'about_valeur_2_titre', label: 'Titre' },
      { cle: 'about_valeur_2_desc', label: 'Description', multiline: true },
    ],
  },
  {
    titre: 'Valeur 3',
    champs: [
      { cle: 'about_valeur_3_titre', label: 'Titre' },
      { cle: 'about_valeur_3_desc', label: 'Description', multiline: true },
    ],
  },
]

export default function ContentEditor() {
  const qc = useQueryClient()
  const [values, setValues] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState<Set<string>>(new Set())

  const { data: contents, isLoading } = useQuery<SiteContent[]>({
    queryKey: ['site-content'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/content')
      return data
    },
  })

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

  if (isLoading) {
    return <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black font-display text-dark">Contenu du site</h1>
          <p className="text-muted text-sm mt-0.5">Modifiez le texte de la page À propos — les changements sont visibles immédiatement.</p>
        </div>
        {dirty.size > 0 && (
          <button onClick={saveAll} className="btn-primary text-sm py-2">
            Sauvegarder tout ({dirty.size})
          </button>
        )}
      </div>

      {SECTIONS.map((section) => (
        <div key={section.titre} className="card space-y-4">
          <h2 className="font-bold font-display text-dark border-b border-gray-100 pb-3">{section.titre}</h2>
          {section.champs.map((champ) => (
            <div key={champ.cle}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="form-label mb-0">{champ.label}</label>
                {dirty.has(champ.cle) && (
                  <button
                    onClick={() => handleSave(champ.cle)}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Sauvegarder
                  </button>
                )}
              </div>
              {champ.multiline ? (
                <textarea
                  rows={3}
                  value={values[champ.cle] ?? ''}
                  onChange={e => handleChange(champ.cle, e.target.value)}
                  className="form-input resize-y"
                />
              ) : (
                <input
                  type="text"
                  value={values[champ.cle] ?? ''}
                  onChange={e => handleChange(champ.cle, e.target.value)}
                  className="form-input"
                />
              )}
              <p className="text-[10px] text-gray-400 mt-1 font-mono">{champ.cle}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

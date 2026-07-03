import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { api } from '../../services/api'

const schema = z.object({
  nomComplet: z.string().min(2, 'Nom complet requis'),
  dateNaissance: z.string().min(1, 'Date de naissance requise'),
  telephone: z.string().min(8, 'Numéro invalide'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  ville: z.string().min(2, 'Ville requise'),
  posteSouhaite: z.enum(['femme_menage', 'nounou', 'cuisinier', 'chauffeur', 'gardien', 'majordome', 'autre']),
  experience: z.enum(['zero_un', 'un_trois', 'trois_cinq', 'cinq_plus']),
  description: z.string().max(1000).optional(),
  disponibilite: z.string().min(2, 'Disponibilité requise'),
  accepteConditions: z.boolean().refine((v) => v, 'Vous devez accepter les conditions.'),
})

type FormData = z.infer<typeof schema>

const STEPS = ['Identité', 'Profil', 'Documents']

export default function FormCandidats() {
  const [step, setStep] = useState(0)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [cniRectoFile, setCniRectoFile] = useState<File | null>(null)
  const [cniVersoFile, setCniVersoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const nextStep = async () => {
    const fields: (keyof FormData)[][] = [
      ['nomComplet', 'dateNaissance', 'telephone', 'email', 'ville'],
      ['posteSouhaite', 'experience', 'disponibilite', 'description'],
    ]
    const ok = await trigger(fields[step])
    if (ok) setStep(step + 1)
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, String(v)) })
      if (cvFile) fd.append('cv', cvFile)
      if (photoFile) fd.append('photo', photoFile)
      if (cniRectoFile) fd.append('cniRecto', cniRectoFile)
      if (cniVersoFile) fd.append('cniVerso', cniVersoFile)
      await api.post('/candidatures', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setDone(true)
      toast.success('Candidature envoyée !')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  const F = ({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) => (
    <div className="form-field">
      <label htmlFor={id} className="form-label">{label}</label>
      {children}
      {error && <p className="form-error"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>{error}</p>}
    </div>
  )

  if (done) {
    return (
      <section id="candidats" className="py-24 bg-surface">
        <div className="max-w-lg mx-auto px-5 text-center">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold font-display text-dark mb-3">Candidature envoyée !</h2>
          <p className="text-muted mb-6">Notre équipe vous contactera prochainement. Merci de votre confiance.</p>
          <button onClick={() => { setDone(false); setStep(0) }} className="btn-outline">Envoyer une autre candidature</button>
        </div>
      </section>
    )
  }

  return (
    <section id="candidats" className="py-24 bg-surface relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(26,127,75,0.06)_0%,_transparent_60%)] pointer-events-none" />

      <div className="max-w-2xl mx-auto px-5 sm:px-8 relative">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <span className="section-tag mb-4">Rejoignez-nous</span>
          <h2 className="section-title mt-3 mb-3">Espace candidats</h2>
          <p className="text-muted">Remplissez le formulaire en 3 étapes — moins de 5 minutes.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  i < step ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : i === step ? 'bg-primary text-white ring-4 ring-primary/20'
                  : 'bg-gray-100 text-gray-400'
                }`}>
                  {i < step ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : i + 1}
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap ${i === step ? 'text-primary' : 'text-gray-400'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all duration-500 ${i < step ? 'bg-primary' : 'bg-gray-100'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            {/* Step 0: Identité */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <F id="nomComplet" label="Nom complet *" error={errors.nomComplet?.message}>
                    <input id="nomComplet" {...register('nomComplet')} className={`form-input ${errors.nomComplet ? 'form-input-error' : ''}`} placeholder="Prénom Nom" />
                  </F>
                  <F id="dateNaissance" label="Date de naissance *" error={errors.dateNaissance?.message}>
                    <input id="dateNaissance" type="date" {...register('dateNaissance')} className={`form-input ${errors.dateNaissance ? 'form-input-error' : ''}`} />
                  </F>
                  <F id="telephone" label="Téléphone *" error={errors.telephone?.message}>
                    <input id="telephone" {...register('telephone')} className={`form-input ${errors.telephone ? 'form-input-error' : ''}`} placeholder="+221 7X XXX XX XX" />
                  </F>
                  <F id="email" label="Email (facultatif)" error={errors.email?.message}>
                    <input id="email" type="email" {...register('email')} className="form-input" placeholder="email@exemple.com" />
                  </F>
                  <F id="ville" label="Ville de résidence *" error={errors.ville?.message}>
                    <input id="ville" {...register('ville')} className={`form-input ${errors.ville ? 'form-input-error' : ''}`} placeholder="Thiès" />
                  </F>
                </div>
              </div>
            )}

            {/* Step 1: Profil */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <F id="posteSouhaite" label="Poste souhaité *" error={errors.posteSouhaite?.message}>
                    <select id="posteSouhaite" {...register('posteSouhaite')} className={`form-input ${errors.posteSouhaite ? 'form-input-error' : ''}`}>
                      <option value="">-- Choisir --</option>
                      <option value="femme_menage">Femme de ménage</option>
                      <option value="nounou">Nounou / Garde d'enfants</option>
                      <option value="cuisinier">Cuisinier(ère)</option>
                      <option value="chauffeur">Chauffeur</option>
                      <option value="gardien">Gardien / Vigile</option>
                      <option value="majordome">Majordome</option>
                      <option value="autre">Autre</option>
                    </select>
                  </F>
                  <F id="experience" label="Expérience *" error={errors.experience?.message}>
                    <select id="experience" {...register('experience')} className={`form-input ${errors.experience ? 'form-input-error' : ''}`}>
                      <option value="">-- Choisir --</option>
                      <option value="zero_un">Moins d'1 an</option>
                      <option value="un_trois">1 à 3 ans</option>
                      <option value="trois_cinq">3 à 5 ans</option>
                      <option value="cinq_plus">Plus de 5 ans</option>
                    </select>
                  </F>
                  <F id="disponibilite" label="Disponibilité *" error={errors.disponibilite?.message}>
                    <input id="disponibilite" {...register('disponibilite')} className={`form-input ${errors.disponibilite ? 'form-input-error' : ''}`} placeholder="Immédiate, dans 1 mois..." />
                  </F>
                </div>
                <F id="description" label="Compétences & motivations" error={errors.description?.message}>
                  <textarea id="description" {...register('description')} rows={4} className="form-input resize-none" placeholder="Décrivez votre expérience et vos compétences..." />
                </F>
              </div>
            )}

            {/* Step 2: Documents */}
            {step === 2 && (
              <div className="space-y-6">
                <p className="text-sm text-muted bg-primary-light/60 rounded-xl px-4 py-3 border border-primary/10">
                  Les fichiers sont facultatifs mais augmentent vos chances d'être sélectionné(e).
                </p>

                {/* Pièce d'identité */}
                <div>
                  <p className="form-label mb-2">
                    Pièce d'identité <span className="text-gray-400 font-normal">(CNI ou Passeport — recto + verso, JPG, PNG, PDF · max 5 Mo)</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { side: 'Recto', file: cniRectoFile, set: setCniRectoFile },
                      { side: 'Verso', file: cniVersoFile, set: setCniVersoFile },
                    ].map(({ side, file, set }) => (
                      <label key={side} className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-primary hover:bg-primary-light/40 transition-all duration-200 group">
                        <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                          <svg className="w-5 h-5 text-muted group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          {file
                            ? <p className="text-sm font-medium text-primary truncate">✓ {file.name}</p>
                            : <p className="text-sm text-muted">{side}</p>
                          }
                        </div>
                        <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="sr-only" onChange={(e) => set(e.target.files?.[0] || null)} />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'CV', accept: '.pdf,.doc,.docx', file: cvFile, set: setCvFile, hint: 'PDF, DOC — max 5 Mo' },
                    { label: 'Photo', accept: '.jpg,.jpeg,.png,.webp', file: photoFile, set: setPhotoFile, hint: 'JPG, PNG — max 2 Mo' },
                  ].map(({ label, accept, file, set, hint }) => (
                    <div key={label}>
                      <p className="form-label mb-2">{label} <span className="text-gray-400 font-normal">({hint})</span></p>
                      <label className="flex items-center gap-4 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-primary hover:bg-primary-light/40 transition-all duration-200 group">
                        <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                          <svg className="w-5 h-5 text-muted group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          {file
                            ? <p className="text-sm font-medium text-primary truncate">✓ {file.name}</p>
                            : <p className="text-sm text-muted">Cliquer pour sélectionner ou glisser le fichier</p>
                          }
                        </div>
                        <input type="file" accept={accept} className="sr-only" onChange={(e) => set(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-3 pt-2">
                  <input type="checkbox" id="accepteConditions" {...register('accepteConditions')} className="mt-0.5 w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer" />
                  <label htmlFor="accepteConditions" className="text-sm text-muted cursor-pointer leading-relaxed">
                    J'accepte que mes données soient utilisées par Global Clean Tech dans le cadre de ma recherche d'emploi. *
                    {errors.accepteConditions && <span className="block text-red-500 text-xs mt-1">{errors.accepteConditions.message}</span>}
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center justify-between mt-5">
            {step > 0
              ? <button type="button" onClick={() => setStep(step - 1)} className="btn-ghost">← Retour</button>
              : <span />
            }
            {step < STEPS.length - 1
              ? <button type="button" onClick={nextStep} className="btn-primary px-8">Suivant →</button>
              : (
                <button type="submit" disabled={loading} className="btn-primary px-8">
                  {loading
                    ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Envoi...</>
                    : 'Envoyer ma candidature 🚀'
                  }
                </button>
              )
            }
          </div>
        </form>
      </div>
    </section>
  )
}



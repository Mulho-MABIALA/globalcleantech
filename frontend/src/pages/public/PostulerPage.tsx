import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { POSTE_LABELS, EXPERIENCE_LABELS, PosteSouhaite, Experience } from '../../types/candidature'

interface FormData {
  nomComplet: string
  dateNaissance: string
  telephone: string
  email?: string
  ville: string
  posteSouhaite: PosteSouhaite
  experience: Experience
  description?: string
  disponibilite: string
  dateDisponibilite?: string
  accepteConditions: boolean
  cv?: FileList
  photo?: FileList
  cniRecto?: FileList
  cniVerso?: FileList
  _hp?: string
}

const POSTES = Object.entries(POSTE_LABELS) as [PosteSouhaite, string][]
const EXPERIENCES = Object.entries(EXPERIENCE_LABELS) as [Experience, string][]

const POSTE_ICONS: Record<PosteSouhaite, React.ReactNode> = {
  femme_menage: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 015 5v2a5 5 0 01-10 0V7a5 5 0 015-5zM3 21a9 9 0 0118 0"/></svg>,
  nounou:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75z"/></svg>,
  cuisinier:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>,
  chauffeur:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>,
  gardien:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>,
  majordome:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>,
  autre:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>,
}

type Step = 1 | 2 | 3

export default function PostulerPage() {
  const [step, setStep] = useState<Step>(1)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register, handleSubmit, watch, trigger,
    formState: { errors },
  } = useForm<FormData>({ mode: 'onBlur' })

  const poste = watch('posteSouhaite')

  const goNext = async () => {
    const fields: (keyof FormData)[] = step === 1
      ? ['nomComplet', 'dateNaissance', 'telephone', 'ville', 'posteSouhaite']
      : ['experience', 'disponibilite', 'accepteConditions']
    const ok = await trigger(fields)
    if (ok) setStep(s => (s + 1) as Step)
  }

  const onSubmit = async (data: FormData) => {
    if (data._hp) return
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('nomComplet', data.nomComplet)
      fd.append('dateNaissance', data.dateNaissance)
      fd.append('telephone', data.telephone)
      if (data.email) fd.append('email', data.email)
      fd.append('ville', data.ville)
      fd.append('posteSouhaite', data.posteSouhaite)
      fd.append('experience', data.experience)
      if (data.description) fd.append('description', data.description)
      fd.append('disponibilite', data.disponibilite)
      if (data.dateDisponibilite) fd.append('dateDisponibilite', data.dateDisponibilite)
      fd.append('accepteConditions', String(data.accepteConditions))
      if (data.cv?.[0]) fd.append('cv', data.cv[0])
      if (data.photo?.[0]) fd.append('photo', data.photo[0])
      if (data.cniRecto?.[0]) fd.append('cniRecto', data.cniRecto[0])
      if (data.cniVerso?.[0]) fd.append('cniVerso', data.cniVerso[0])
      await api.post('/candidatures', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setSubmitted(true)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message ?? 'Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center px-4 py-12 sm:py-20">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black font-display text-dark mb-3">Candidature envoyée !</h1>
          <p className="text-muted mb-2">Merci pour votre candidature. Notre équipe va l'étudier et vous contactera dans les plus brefs délais.</p>
          <p className="text-sm text-muted mb-8">Nous vous appellerons au numéro fourni dans les <strong className="text-dark">48 heures ouvrables</strong>.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="btn-primary">Retour à l'accueil</Link>
            <button onClick={() => { setSubmitted(false); setStep(1) }} className="btn-outline">Nouvelle candidature</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-white">
      {/* Hero compact */}
      <div className="bg-dark text-white py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block bg-primary/20 text-primary-light text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">Rejoindre l'équipe</span>
          <h1 className="text-3xl sm:text-4xl font-black font-display mb-3">Déposez votre candidature</h1>
          <p className="text-white/70 text-base max-w-lg mx-auto">
            Global Clean Tech place des professionnels qualifiés dans des foyers et entreprises à Thiès et dans la région.
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-center gap-2">
          {([1, 2, 3] as Step[]).map((s) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 ${step === s ? 'text-primary' : step > s ? 'text-emerald-500' : 'text-gray-300'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${step === s ? 'border-primary bg-primary text-white' : step > s ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-200 text-gray-300'}`}>
                  {step > s ? '✓' : s}
                </div>
                <span className="text-xs font-medium hidden sm:block">
                  {s === 1 ? 'Identité' : s === 2 ? 'Expérience' : 'Documents'}
                </span>
              </div>
              {s < 3 && <div className={`h-px flex-1 max-w-16 transition-colors ${step > s ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Honeypot */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
            <input tabIndex={-1} autoComplete="off" {...register('_hp')} />
          </div>

          {/* Étape 1 — Identité */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="mb-8">
                <h2 className="text-xl font-bold font-display text-dark">Vos informations personnelles</h2>
                <p className="text-muted text-sm mt-1">Ces informations nous permettront de vous contacter.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="form-label">Nom complet <span className="text-red-500">*</span></label>
                  <input className={`form-input ${errors.nomComplet ? 'border-red-400' : ''}`}
                    placeholder="Prénom Nom"
                    {...register('nomComplet', { required: 'Nom requis', minLength: { value: 3, message: 'Minimum 3 caractères' } })} />
                  {errors.nomComplet && <p className="text-red-500 text-xs mt-1">{errors.nomComplet.message}</p>}
                </div>

                <div>
                  <label className="form-label">Date de naissance <span className="text-red-500">*</span></label>
                  <input type="date" className={`form-input ${errors.dateNaissance ? 'border-red-400' : ''}`}
                    max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().slice(0, 10)}
                    {...register('dateNaissance', { required: 'Date de naissance requise' })} />
                  {errors.dateNaissance && <p className="text-red-500 text-xs mt-1">{errors.dateNaissance.message}</p>}
                </div>

                <div>
                  <label className="form-label">Téléphone <span className="text-red-500">*</span></label>
                  <input type="tel" className={`form-input ${errors.telephone ? 'border-red-400' : ''}`}
                    placeholder="7X XXX XX XX"
                    {...register('telephone', { required: 'Téléphone requis', pattern: { value: /^[\d\s+\-()]{8,}$/, message: 'Numéro invalide' } })} />
                  {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone.message}</p>}
                </div>

                <div>
                  <label className="form-label">Email <span className="text-gray-400 font-normal">(optionnel)</span></label>
                  <input type="email" className="form-input" placeholder="vous@exemple.com"
                    {...register('email', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email invalide' } })} />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="form-label">Ville de résidence <span className="text-red-500">*</span></label>
                  <input className={`form-input ${errors.ville ? 'border-red-400' : ''}`}
                    placeholder="Thiès, Dakar..."
                    {...register('ville', { required: 'Ville requise' })} />
                  {errors.ville && <p className="text-red-500 text-xs mt-1">{errors.ville.message}</p>}
                </div>
              </div>

              {/* Poste souhaité */}
              <div>
                <label className="form-label mb-3 block">Poste souhaité <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {POSTES.map(([value, label]) => (
                    <label key={value} className={`relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${poste === value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                      <input type="radio" value={value} className="sr-only" {...register('posteSouhaite', { required: 'Choisissez un poste' })} />
                      <span className={`w-7 h-7 ${poste === value ? 'text-primary' : 'text-muted'}`}>{POSTE_ICONS[value]}</span>
                      <span className="text-xs font-medium text-center text-dark leading-tight">{label}</span>
                      {poste === value && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
                {errors.posteSouhaite && <p className="text-red-500 text-xs mt-2">{errors.posteSouhaite.message}</p>}
              </div>

              <div className="flex justify-end pt-2">
                <button type="button" onClick={goNext} className="btn-primary px-8">
                  Suivant →
                </button>
              </div>
            </div>
          )}

          {/* Étape 2 — Expérience */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="mb-8">
                <h2 className="text-xl font-bold font-display text-dark">Votre expérience</h2>
                <p className="text-muted text-sm mt-1">Dites-nous en plus sur votre parcours professionnel.</p>
              </div>

              <div>
                <label className="form-label mb-3 block">Années d'expérience <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  {EXPERIENCES.map(([value, label]) => {
                    const exp = watch('experience')
                    return (
                      <label key={value} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${exp === value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" value={value} className="sr-only" {...register('experience', { required: 'Choisissez votre expérience' })} />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${exp === value ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                          {exp === value && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <span className="text-sm font-medium text-dark">{label}</span>
                      </label>
                    )
                  })}
                </div>
                {errors.experience && <p className="text-red-500 text-xs mt-2">{errors.experience.message}</p>}
              </div>

              <div>
                <label className="form-label">Décrivez votre expérience <span className="text-gray-400 font-normal">(optionnel)</span></label>
                <textarea rows={4} className="form-input resize-none"
                  placeholder="Décrivez vos expériences précédentes, vos qualités, ce qui vous distingue..."
                  {...register('description')} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Disponibilité <span className="text-red-500">*</span></label>
                  <input className={`form-input ${errors.disponibilite ? 'border-red-400' : ''}`}
                    placeholder="Immédiatement, dans 2 semaines..."
                    {...register('disponibilite', { required: 'Disponibilité requise' })} />
                  {errors.disponibilite && <p className="text-red-500 text-xs mt-1">{errors.disponibilite.message}</p>}
                </div>
                <div>
                  <label className="form-label">Date exacte de disponibilité <span className="text-gray-400 font-normal">(optionnel)</span></label>
                  <input type="date" className="form-input" min={new Date().toISOString().slice(0, 10)} {...register('dateDisponibilite')} />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-ghost">← Retour</button>
                <button type="button" onClick={goNext} className="btn-primary px-8">Suivant →</button>
              </div>
            </div>
          )}

          {/* Étape 3 — Documents */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="mb-8">
                <h2 className="text-xl font-bold font-display text-dark">Documents & confirmation</h2>
                <p className="text-muted text-sm mt-1">Les fichiers sont optionnels mais augmentent vos chances.</p>
              </div>

              {/* Pièce d'identité */}
              <div className="mb-4">
                <label className="form-label">
                  Pièce d'identité
                  <span className="text-gray-400 font-normal ml-1">(CNI ou Passeport — recto + verso)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Recto */}
                  <label className="flex flex-col items-center gap-2 p-5 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-dark">{watch('cniRecto')?.[0]?.name ?? 'Recto'}</p>
                      <p className="text-xs text-muted">JPG, PNG, PDF · max 5 Mo</p>
                    </div>
                    <input type="file" accept="image/*,.pdf" className="sr-only" {...register('cniRecto')} />
                  </label>

                  {/* Verso */}
                  <label className="flex flex-col items-center gap-2 p-5 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-dark">{watch('cniVerso')?.[0]?.name ?? 'Verso'}</p>
                      <p className="text-xs text-muted">JPG, PNG, PDF · max 5 Mo</p>
                    </div>
                    <input type="file" accept="image/*,.pdf" className="sr-only" {...register('cniVerso')} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Photo de profil <span className="text-gray-400 font-normal">(max 2 Mo)</span></label>
                  <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                    <svg className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 10.5V6.75a.75.75 0 00-.75-.75H4.5A.75.75 0 003.75 6.75v10.5a.75.75 0 00.75.75h10.5a.75.75 0 00.75-.75V10.5M13.5 10.5H9.75" />
                    </svg>
                    <div className="text-center">
                      <p className="text-sm font-medium text-dark">{watch('photo')?.[0]?.name ?? 'Choisir une photo'}</p>
                      <p className="text-xs text-muted mt-0.5">JPG, PNG · max 2 Mo</p>
                    </div>
                    <input type="file" accept="image/*" className="sr-only" {...register('photo')} />
                  </label>
                </div>

                <div>
                  <label className="form-label">CV <span className="text-gray-400 font-normal">(max 5 Mo)</span></label>
                  <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                    <svg className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <div className="text-center">
                      <p className="text-sm font-medium text-dark">{watch('cv')?.[0]?.name ?? 'Choisir un CV'}</p>
                      <p className="text-xs text-muted mt-0.5">PDF, Word · max 5 Mo</p>
                    </div>
                    <input type="file" accept=".pdf,.doc,.docx" className="sr-only" {...register('cv')} />
                  </label>
                </div>
              </div>

              {/* Récap */}
              <div className="bg-surface rounded-xl p-4 space-y-2 text-sm">
                <p className="font-semibold text-dark mb-3">Récapitulatif</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  <span className="text-muted">Nom</span><span className="font-medium text-dark">{watch('nomComplet')}</span>
                  <span className="text-muted">Téléphone</span><span className="font-medium text-dark">{watch('telephone')}</span>
                  <span className="text-muted">Ville</span><span className="font-medium text-dark">{watch('ville')}</span>
                  <span className="text-muted">Poste</span><span className="font-medium text-dark">{POSTE_LABELS[watch('posteSouhaite')] ?? '—'}</span>
                  <span className="text-muted">Expérience</span><span className="font-medium text-dark">{EXPERIENCE_LABELS[watch('experience')] ?? '—'}</span>
                  <span className="text-muted">Disponibilité</span><span className="font-medium text-dark">{watch('disponibilite')}</span>
                </div>
              </div>

              <div>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    {...register('accepteConditions', { required: 'Vous devez accepter les conditions' })} />
                  <span className="text-sm text-muted group-hover:text-dark transition-colors">
                    J'accepte que mes informations soient conservées par Global Clean Tech dans le cadre de ma recherche d'emploi. Elles ne seront jamais partagées à des tiers sans mon accord.
                  </span>
                </label>
                {errors.accepteConditions && <p className="text-red-500 text-xs mt-1 ml-7">{errors.accepteConditions.message}</p>}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setStep(2)} className="btn-ghost">← Retour</button>
                <button type="submit" disabled={loading} className="btn-primary px-8 gap-2 disabled:opacity-60">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      Envoyer ma candidature
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Infos rassurantes */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            {
              title: 'Données sécurisées', desc: 'Vos infos restent confidentielles', color: 'text-emerald-600 bg-emerald-50',
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>,
            },
            {
              title: 'Réponse rapide', desc: 'Contact sous 48h ouvrables', color: 'text-blue-600 bg-blue-50',
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>,
            },
            {
              title: 'Accompagnement', desc: 'Suivi personnalisé de votre dossier', color: 'text-amber-600 bg-amber-50',
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>,
            },
          ].map(c => (
            <div key={c.title} className="p-4 rounded-xl bg-white border border-gray-100 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.color}`}>
                <span className="w-5 h-5">{c.icon}</span>
              </div>
              <p className="font-semibold text-dark text-sm">{c.title}</p>
              <p className="text-xs text-muted mt-1">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}



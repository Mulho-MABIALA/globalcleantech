import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { api } from '../../services/api'

const schema = z
  .object({
    nomRaisonSociale: z.string().min(2, 'Nom / Raison sociale requis'),
    typeDemandeur: z.enum(['particulier', 'entreprise', 'institution']),
    telephone: z.string().min(8, 'Numéro invalide'),
    email: z.string().email('Email invalide'),
    serviceSouhaite: z.enum(['placement', 'impression', 'redaction', 'transfert', 'communication', 'autre']),
    posteRecherche: z.string().max(100).optional(),
    nombrePersonnes: z.string().optional(),
    description: z.string().min(10, 'Décrivez votre besoin (min 10 caractères)'),
    budgetEstime: z.string().max(100).optional(),
    dateSouhaitee: z.string().optional(),
  })
  .refine((d) => d.serviceSouhaite !== 'placement' || (d.posteRecherche && d.posteRecherche.length > 0), {
    message: 'Précisez le poste recherché.', path: ['posteRecherche'],
  })

type FormData = z.infer<typeof schema>

const SERVICE_OPTIONS = [
  { value: 'placement', label: '👥 Placement de personnel' },
  { value: 'impression', label: '🖨️ Impression / Numérisation' },
  { value: 'redaction', label: '✍️ Rédaction / Journalisme' },
  { value: 'transfert', label: "💸 Transfert d'argent" },
  { value: 'communication', label: '📢 Communication' },
  { value: 'autre', label: '✨ Autre service' },
]

export default function FormClients() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const service = watch('serviceSouhaite')

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await api.post('/demandes', { ...data, nombrePersonnes: data.nombrePersonnes ? parseInt(data.nombrePersonnes) : undefined })
      setDone(true)
      reset()
      toast.success('Demande envoyée ! Vous recevrez une confirmation par email.')
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
      <section id="clients" className="py-24 bg-white">
        <div className="max-w-lg mx-auto px-5 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg" style={{ background: 'linear-gradient(135deg, #C8860A, #E8A020)' }}>
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold font-display text-dark mb-3">Demande envoyée !</h2>
          <p className="text-muted mb-6">Un email de confirmation vous a été envoyé. Notre équipe vous contactera sous 24h.</p>
          <button onClick={() => setDone(false)} className="btn-outline">Faire une nouvelle demande</button>
        </div>
      </section>
    )
  }

  return (
    <section id="clients" className="py-24 bg-white relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(200,134,10,0.05)_0%,_transparent_60%)] pointer-events-none" />

      <div className="max-w-2xl mx-auto px-5 sm:px-8 relative">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-widest bg-accent-light px-3 py-1.5 rounded-full mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Vous recrutez ?
          </span>
          <h2 className="section-title mt-3 mb-3">Espace clients & entreprises</h2>
          <p className="text-muted">Décrivez votre besoin — notre équipe vous répond sous 24h.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Accent bar top */}
          <div className="h-1 bg-gradient-to-r from-accent via-amber-400 to-accent" />

          <div className="p-6 sm:p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <F id="nomRaisonSociale" label="Nom / Raison sociale *" error={errors.nomRaisonSociale?.message}>
                <input id="nomRaisonSociale" {...register('nomRaisonSociale')} className={`form-input ${errors.nomRaisonSociale ? 'form-input-error' : ''}`} placeholder="Votre nom ou celui de votre entreprise" />
              </F>
              <F id="typeDemandeur" label="Vous êtes *" error={errors.typeDemandeur?.message}>
                <select id="typeDemandeur" {...register('typeDemandeur')} className={`form-input ${errors.typeDemandeur ? 'form-input-error' : ''}`}>
                  <option value="">-- Choisir --</option>
                  <option value="particulier">Particulier</option>
                  <option value="entreprise">Entreprise</option>
                  <option value="institution">Institution / ONG</option>
                </select>
              </F>
              <F id="telephone" label="Téléphone *" error={errors.telephone?.message}>
                <input id="telephone" {...register('telephone')} className={`form-input ${errors.telephone ? 'form-input-error' : ''}`} placeholder="+221 7X XXX XX XX" />
              </F>
              <F id="email" label="Email *" error={errors.email?.message}>
                <input id="email" type="email" {...register('email')} className={`form-input ${errors.email ? 'form-input-error' : ''}`} placeholder="vous@exemple.com" />
              </F>
            </div>

            {/* Service selector */}
            <F id="serviceSouhaite" label="Service souhaité *" error={errors.serviceSouhaite?.message}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                {SERVICE_OPTIONS.map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer text-sm font-medium transition-all duration-150
                    ${service === opt.value ? 'border-accent bg-accent-light text-accent' : 'border-gray-200 text-muted hover:border-accent/40 hover:bg-accent-light/30'}`}>
                    <input type="radio" value={opt.value} {...register('serviceSouhaite')} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>
              {errors.serviceSouhaite && <p className="form-error mt-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>{errors.serviceSouhaite.message}</p>}
            </F>

            {service === 'placement' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface rounded-xl border border-gray-100">
                <F id="posteRecherche" label="Poste recherché *" error={errors.posteRecherche?.message}>
                  <input id="posteRecherche" {...register('posteRecherche')} className={`form-input ${errors.posteRecherche ? 'form-input-error' : ''}`} placeholder="Ex: Femme de ménage..." />
                </F>
                <F id="nombrePersonnes" label="Nombre de personnes" error={undefined}>
                  <input id="nombrePersonnes" type="number" min="1" {...register('nombrePersonnes')} className="form-input" placeholder="1" />
                </F>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <F id="budgetEstime" label="Budget estimé (facultatif)" error={undefined}>
                <input id="budgetEstime" {...register('budgetEstime')} className="form-input" placeholder="Ex: 50 000 FCFA/mois" />
              </F>
              <F id="dateSouhaitee" label="Date souhaitée (facultatif)" error={undefined}>
                <input id="dateSouhaitee" type="date" {...register('dateSouhaitee')} className="form-input" />
              </F>
            </div>

            <F id="description" label="Description de votre besoin *" error={errors.description?.message}>
              <textarea id="description" {...register('description')} rows={4} className={`form-input resize-none ${errors.description ? 'form-input-error' : ''}`} placeholder="Détaillez votre besoin : horaires, lieu, exigences particulières..." />
            </F>

            <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 bg-accent text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-amber-700 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 text-base">
              {loading
                ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Envoi en cours...</>
                : <>Envoyer ma demande <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg></>
              }
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}


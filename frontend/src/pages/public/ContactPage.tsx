import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import axios from 'axios'

const schema = z.object({
  nom: z.string().min(2, 'Requis'),
  email: z.string().email('Email invalide'),
  telephone: z.string().optional(),
  sujet: z.string().min(3, 'Requis').max(200),
  corps: z.string().min(10, 'Minimum 10 caractères'),
  _hp: z.string().max(0, 'Bot détecté').optional(), // honeypot
})
type FormData = z.infer<typeof schema>

const CHANNELS = [
  {
    label: 'Email',
    value: 'contact@globalcleantech.sn',
    href: 'mailto:contact@globalcleantech.sn',
    color: '#1A7F4B',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    value: 'Réponse rapide',
    href: `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}?text=Bonjour%20Global%20Clean%20Tech`,
    color: '#25D366',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    value: '@globalcleantech',
    href: import.meta.env.VITE_FACEBOOK_URL || '#',
    color: '#1877F2',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: 'X (Twitter)',
    value: '@globalcleantech',
    href: import.meta.env.VITE_TWITTER_URL || '#',
    color: '#000000',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
]

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-dark mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{error}</p>}
    </div>
  )
}

export default function ContactPage() {
  const [done, setDone] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    if (data._hp) return // bot silencieux
    try {
      const { _hp: _, ...payload } = data
      await axios.post('/api/messages', payload)
      setDone(true)
      reset()
    } catch {
      toast.error('Une erreur est survenue. Réessayez ou contactez-nous par WhatsApp.')
    }
  }

  return (
    <main className="bg-surface min-h-screen">
      {/* Hero compact */}
      <div className="bg-gradient-to-br from-[#0D3D27] via-primary to-[#2AAD6A] py-20 px-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.05)_0%,_transparent_70%)]" />
        <div className="relative max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 bg-white/15 text-white/90 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-white/20 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Contactez-nous
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
            Nous sommes<br />
            <span className="text-white/70 font-light italic">à votre écoute</span>
          </h1>
          <p className="text-white/65 text-lg">Réponse garantie sous 2h en jours ouvrés.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* Left — formulaire */}
          <div className="lg:col-span-3">
            {done ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold font-display text-dark mb-3">Message envoyé !</h2>
                <p className="text-muted mb-6 max-w-sm mx-auto">Notre équipe a reçu votre message et vous répondra sous 2h en jours ouvrés.</p>
                <button onClick={() => setDone(false)} className="inline-flex items-center gap-2 border border-primary text-primary font-semibold px-6 py-2.5 rounded-xl hover:bg-primary-light transition-colors text-sm">
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary via-emerald-400 to-primary-dark" />
                <div className="p-8 sm:p-10">
                  <h2 className="text-xl font-bold font-display text-dark mb-1">Envoyer un message</h2>
                  <p className="text-muted text-sm mb-7">Remplissez le formulaire — nous revenons vers vous rapidement.</p>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Honeypot — invisible aux humains */}
                    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
                      <input tabIndex={-1} autoComplete="off" {...register('_hp')} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field id="nom" label="Nom complet *" error={errors.nom?.message}>
                        <input id="nom" {...register('nom')} className={`form-input ${errors.nom ? 'border-red-400' : ''}`} placeholder="Votre nom complet" />
                      </Field>
                      <Field id="email" label="Email *" error={errors.email?.message}>
                        <input id="email" type="email" {...register('email')} className={`form-input ${errors.email ? 'border-red-400' : ''}`} placeholder="vous@exemple.com" />
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field id="telephone" label="Téléphone (facultatif)" error={undefined}>
                        <input id="telephone" {...register('telephone')} className="form-input" placeholder="+221 7X XXX XX XX" />
                      </Field>
                      <Field id="sujet" label="Sujet *" error={errors.sujet?.message}>
                        <input id="sujet" {...register('sujet')} className={`form-input ${errors.sujet ? 'border-red-400' : ''}`} placeholder="Demande de placement, devis..." />
                      </Field>
                    </div>

                    <Field id="corps" label="Votre message *" error={errors.corps?.message}>
                      <textarea
                        id="corps"
                        {...register('corps')}
                        rows={6}
                        className={`form-input resize-none ${errors.corps ? 'border-red-400' : ''}`}
                        placeholder="Décrivez votre besoin en détail..."
                      />
                    </Field>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-4 rounded-xl hover:bg-primary-dark active:scale-[0.99] transition-all duration-200 disabled:opacity-60 text-base"
                    >
                      {isSubmitting ? (
                        <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Envoi en cours...</>
                      ) : (
                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Envoyer le message</>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Right — infos + canaux */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold font-display text-dark mb-4">Nos coordonnées</h3>
              <ul className="space-y-3 text-sm text-muted">
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span>Thiès, Sénégal<br /><span className="text-xs text-muted/70">Région de Thiès</span></span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <a href="mailto:contact@globalcleantech.sn" className="hover:text-primary transition-colors">contact@globalcleantech.sn</a>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>Lun–Sam, 8h–18h</span>
                </li>
              </ul>
            </div>

            {/* Canaux */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold font-display text-dark mb-4">Autres canaux</h3>
              <div className="space-y-3">
                {CHANNELS.map(c => (
                  <a
                    key={c.label}
                    href={c.href}
                    target={c.href.startsWith('mailto') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-dark">{c.label}</p>
                      <p className="text-xs text-muted truncate">{c.value}</p>
                    </div>
                    <svg className="w-4 h-4 text-muted group-hover:text-dark group-hover:translate-x-0.5 transition-all duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Info site banner */}
            <a
              href={import.meta.env.VITE_INFO_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 p-4 bg-gradient-to-r from-primary to-primary-dark rounded-2xl text-white hover:shadow-lg transition-shadow"
            >
              <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold">Site d'information</p>
                <p className="text-xs text-white/70">Actualités & conseils emploi</p>
              </div>
              <svg className="w-4 h-4 text-white/70 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}

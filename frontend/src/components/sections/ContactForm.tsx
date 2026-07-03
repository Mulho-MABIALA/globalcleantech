import React, { useState } from 'react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

const SUJETS = [
  'Placement de personnel', 'Demande de renseignement', 'Impression & photocopie',
  'Transfert d\'argent', 'Partenariat', 'Autre',
]

export default function ContactForm() {
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', sujet: '', corps: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/public/contact', form)
      setDone(true)
      toast.success('Message envoyé !')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Erreur lors de l\'envoi.')
    } finally { setLoading(false) }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-dark font-display mb-2">Message envoyé !</h3>
        <p className="text-muted text-sm max-w-xs">Notre équipe vous répondra dans les 24-48h ouvrables.</p>
        <button onClick={() => { setDone(false); setForm({ nom: '', email: '', telephone: '', sujet: '', corps: '' }) }}
          className="mt-6 text-sm text-primary hover:underline">Envoyer un autre message</button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Nom complet *</label>
          <input required value={form.nom} onChange={set('nom')} className="form-input" placeholder="Votre nom" />
        </div>
        <div>
          <label className="form-label">Email *</label>
          <input required type="email" value={form.email} onChange={set('email')} className="form-input" placeholder="vous@exemple.com" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Téléphone</label>
          <input type="tel" value={form.telephone} onChange={set('telephone')} className="form-input" placeholder="77 XXX XX XX" />
        </div>
        <div>
          <label className="form-label">Sujet *</label>
          <select required value={form.sujet} onChange={set('sujet')} className="form-input">
            <option value="">-- Choisir --</option>
            {SUJETS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="form-label">Message *</label>
        <textarea required rows={4} value={form.corps} onChange={set('corps')} className="form-input resize-none" placeholder="Décrivez votre demande..." />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Envoi en cours...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
            Envoyer le message
          </span>
        )}
      </button>
    </form>
  )
}

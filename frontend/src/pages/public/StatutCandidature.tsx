import React, { useState } from 'react'
import { api } from '../../services/api'

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  recu:      { label: 'Dossier reçu',        color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',   icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg> },
  en_cours:  { label: 'En cours d\'examen',  color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg> },
  entretien: { label: 'Entretien prévu',     color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> },
  accepte:   { label: 'Candidature acceptée', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
  place:     { label: 'Placé avec succès 🎉', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg> },
  refuse:    { label: 'Non retenu',           color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200',   icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
}

const POSTES: Record<string, string> = {
  femme_menage: 'Femme de ménage', nounou: 'Nounou', cuisinier: 'Cuisinier(ère)',
  chauffeur: 'Chauffeur', gardien: 'Gardien', majordome: 'Majordome', autre: 'Autre',
}

interface Result { id: number; nomComplet: string; posteSouhaite: string; statut: string; createdAt: string }

export default function StatutCandidature() {
  const [tel, setTel] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  const check = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setResult(null)
    try {
      const { data } = await api.get(`/public/candidature/statut?telephone=${encodeURIComponent(tel)}`)
      setResult(data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Aucune candidature trouvée pour ce numéro.')
    } finally { setLoading(false) }
  }

  const cfg = result ? (STATUT_CONFIG[result.statut] ?? STATUT_CONFIG.recu) : null

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary to-primary-dark p-8 text-white text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
            </div>
            <h1 className="text-xl font-black font-display">Suivi de candidature</h1>
            <p className="text-white/70 text-sm mt-1">Entrez votre numéro de téléphone</p>
          </div>

          <div className="p-8">
            <form onSubmit={check} className="space-y-4">
              <div>
                <label className="form-label">Numéro de téléphone</label>
                <input
                  type="tel" value={tel} onChange={e => setTel(e.target.value)} required
                  className="form-input text-lg tracking-wider" placeholder="77 XXX XX XX"
                />
              </div>
              <button type="submit" disabled={loading || tel.length < 8} className="btn-primary w-full py-3.5">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Recherche...
                  </span>
                ) : 'Vérifier mon dossier'}
              </button>
            </form>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                </svg>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {result && cfg && (
              <div className="mt-6 space-y-4">
                <div className={`p-5 rounded-2xl border ${cfg.bg}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={cfg.color}>{cfg.icon}</span>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Statut du dossier</p>
                      <p className={`font-bold text-lg font-display ${cfg.color}`}>{cfg.label}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Candidat</span>
                      <span className="font-medium text-dark">{result.nomComplet}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Poste souhaité</span>
                      <span className="font-medium text-dark">{POSTES[result.posteSouhaite] ?? result.posteSouhaite}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Déposée le</span>
                      <span className="font-medium text-dark">{new Date(result.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <a href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}?text=Bonjour, je voudrais avoir des nouvelles de ma candidature #${result.id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold rounded-xl py-3 hover:bg-[#1da851] transition-colors text-sm">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Contacter via WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          <a href="/" className="hover:text-primary transition-colors">← Retour à l'accueil</a>
        </p>
      </div>
    </div>
  )
}


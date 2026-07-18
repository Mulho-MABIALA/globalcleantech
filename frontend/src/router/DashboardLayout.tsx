import React, { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import { removeToken, api } from '../services/api'
import { useMessageStats } from '../hooks/useMessages'
import { useMe, useAvatarUrl } from '../hooks/useMe'
import WhatsAppButton from '../components/layout/WhatsAppButton'
import NotificationBell from '../components/layout/NotificationBell'

const NAV_GROUPS = [
  {
    title: 'Activité',
    items: [
      {
        to: '/admin/dashboard',
        label: 'Tableau de bord',
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
      },
      {
        to: '/admin/candidatures',
        label: 'Candidatures',
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      },
      {
        to: '/admin/demandes',
        label: 'Demandes clients',
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
      },
      {
        to: '/admin/placements',
        label: 'Placements',
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
      },
    ],
  },
  {
    title: 'Communication',
    items: [
      {
        to: '/admin/messages',
        label: 'Messages',
        badge: true,
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
      },
      {
        to: '/admin/temoignages',
        label: 'Témoignages',
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
      },
      {
        to: '/admin/newsletter',
        label: 'Newsletter',
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>,
      },
    ],
  },
  {
    title: 'Contenu du site',
    items: [
      {
        to: '/admin/actualites',
        label: 'Actualités',
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>,
      },
      {
        to: '/admin/services',
        label: 'Services du site',
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      },
      {
        to: '/admin/contenu',
        label: 'Textes du site',
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        to: '/admin/utilisateurs',
        label: 'Utilisateurs',
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      },
    ],
  },
]

interface SearchResult {
  candidatures: { id: number; nomComplet: string; posteSouhaite: string; ville: string; statut: string }[]
  demandes: { id: number; nomRaisonSociale: string; serviceSouhaite: string; statut: string }[]
  messages: { id: number; nom: string; sujet: string; statut: string }[]
}

function GlobalSearch() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (q.length < 2) { setResults(null); setOpen(false); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await api.get('/search', { params: { q } })
        setResults(r.data)
        setOpen(true)
      } finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const total = (results?.candidatures.length ?? 0) + (results?.demandes.length ?? 0) + (results?.messages.length ?? 0)

  const go = (path: string) => { navigate(path); setQ(''); setOpen(false) }

  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          className="w-full bg-gray-100 rounded-lg pl-9 pr-4 py-2 text-sm text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Recherche globale..."
        />
        {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
      </div>

      {open && results && (
        <div className="absolute top-full mt-2 left-0 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {total === 0 ? (
            <div className="p-4 text-center text-muted text-sm">Aucun résultat pour "{q}"</div>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
              {results.candidatures.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-muted bg-gray-50 uppercase tracking-wide">Candidatures</p>
                  {results.candidatures.map(c => (
                    <button key={c.id} onClick={() => go(`/admin/candidatures/${c.id}`)} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3">
                      <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-bold shrink-0">{c.nomComplet[0]}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-dark truncate">{c.nomComplet}</p>
                        <p className="text-xs text-muted">{c.posteSouhaite} · {c.ville}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.demandes.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-muted bg-gray-50 uppercase tracking-wide">Demandes clients</p>
                  {results.demandes.map(d => (
                    <button key={d.id} onClick={() => go(`/admin/demandes/${d.id}`)} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3">
                      <div className="w-7 h-7 bg-accent/10 rounded-full flex items-center justify-center text-accent text-xs font-bold shrink-0">{d.nomRaisonSociale[0]}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-dark truncate">{d.nomRaisonSociale}</p>
                        <p className="text-xs text-muted">{d.serviceSouhaite}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.messages.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-muted bg-gray-50 uppercase tracking-wide">Messages</p>
                  {results.messages.map(m => (
                    <button key={m.id} onClick={() => go(`/admin/messages/${m.id}`)} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">{m.nom[0]}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-dark truncate">{m.nom}</p>
                        <p className="text-xs text-muted truncate">{m.sujet}</p>
                      </div>
                      {m.statut === 'non_lu' && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate()
  const { data: msgStats } = useMessageStats()
  const nonLus = msgStats?.nonLus ?? 0

  const logout = async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    removeToken()
    navigate('/admin/login', { replace: true })
  }

  return (
    <aside className="flex flex-col w-full h-full bg-gradient-to-b from-[#12271C] to-[#0C1F15] text-white">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-md shadow-black/20">
            <img src="/logo.png" alt="Global Clean Tech" className="h-7 w-auto object-contain" />
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-sm leading-tight truncate">Global Clean Tech</p>
            <p className="text-[11px] text-emerald-200/60">Espace administration</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
        {NAV_GROUPS.map(group => (
          <div key={group.title} className="mb-2">
            <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-100/40">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map(n => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'text-emerald-50/60 hover:bg-white/[0.06] hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-300 rounded-r-full" />}
                      {n.icon}
                      <span className="flex-1">{n.label}</span>
                      {'badge' in n && n.badge && nonLus > 0 && (
                        <span className="bg-red-500 text-white text-[11px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center">
                          {nonLus > 9 ? '9+' : nonLus}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
        <a href="/contact" target="_blank" className="flex items-center gap-3 px-3 py-2.5 text-emerald-50/60 hover:text-white text-sm font-medium transition-colors rounded-xl hover:bg-white/[0.06]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          Voir le site
        </a>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Déconnexion
        </button>
      </div>
    </aside>
  )
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: me } = useMe()
  const avatarUrl = useAvatarUrl(me?.avatarPath)

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar desktop — sticky : reste en place quand la page défile */}
      <div className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </div>

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72">
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header global avec recherche */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-1 rounded text-dark lg:hidden">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="font-semibold font-display text-dark text-sm lg:hidden">Global Clean Tech</span>
          <div className="hidden lg:flex flex-1 items-center">
            <GlobalSearch />
          </div>
          <div className="lg:hidden flex-1" />
          <NotificationBell />
          <Link to="/admin/profil" title="Mon profil" className="flex items-center gap-2 p-1.5 lg:pr-3 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
            <span className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-primary shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={me?.name ?? 'Profil'} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              )}
            </span>
            <span className="text-sm font-medium hidden lg:inline">{me?.name ?? 'Mon profil'}</span>
          </Link>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full">
          <Outlet />
        </main>

        <footer className="border-t border-gray-200 px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
          <p>© {new Date().getFullYear()} Global Clean Tech — Tous droits réservés.</p>
          <p className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            Espace administration · Thiès, Sénégal
          </p>
        </footer>
      </div>

      <WhatsAppButton />
    </div>
  )
}

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { api } from '../../services/api'
import Badge from '../../components/ui/Badge'
import { POSTE_LABELS, PosteSouhaite, StatutCandidature } from '../../types/candidature'
import { SERVICE_LABELS, ServiceSouhaite, StatutDemande } from '../../types/demande'

type AnyStatut = StatutCandidature | StatutDemande

/* ── types ── */
interface Stats {
  candidatures: { total: number; nouveaux_7j: number; a_traiter: number; par_poste: Record<string, number>; par_statut: Record<string, number>; tendance_30j: number }
  demandes: { total: number; nouveaux_7j: number; nouvelles: number; par_service: Record<string, number>; tendance_30j: number }
  messages: { total: number; non_lus: number; nouveaux_7j: number; tendance_30j: number }
  graph_7j: { date: string; candidatures: number; demandes: number; messages: number }[]
  dernieres_candidatures: Array<{ id: number; nomComplet: string; posteSouhaite: keyof typeof POSTE_LABELS; ville: string; statut: AnyStatut; createdAt: string }>
  dernieres_demandes: Array<{ id: number; nomRaisonSociale: string; serviceSouhaite: keyof typeof SERVICE_LABELS; statut: AnyStatut; createdAt: string }>
  derniers_messages: Array<{ id: number; nom: string; sujet: string; statut: string; createdAt: string }>
}

/* ── palette ── */
const COLORS = {
  primary: '#1A7F4B',
  accent: '#C8860A',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  red: '#EF4444',
  emerald: '#10B981',
}

const STATUT_COLORS = ['#1A7F4B', '#3B82F6', '#10B981', '#6B7280']
const SERVICE_PIE_COLORS = ['#1A7F4B', '#C8860A', '#3B82F6', '#8B5CF6', '#EF4444', '#10B981']

/* ── helpers ── */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "À l'instant"
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  return fmtDate(iso)
}

/* ── Trend badge ── */
function Trend({ pct }: { pct: number }) {
  const up = pct >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d={up ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
      </svg>
      {Math.abs(pct)}%
    </span>
  )
}

/* ── KPI Card ── */
function KpiCard({ label, value, sub, icon, color, bg, trend, alert }: {
  label: string; value: number | string; sub?: string
  icon: React.ReactNode; color: string; bg: string
  trend?: number; alert?: boolean
}) {
  return (
    <div className={`bg-white rounded-2xl border ${alert ? 'border-red-200' : 'border-gray-200'} p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`} style={{ color }}>
          {icon}
        </div>
        {trend !== undefined && <Trend pct={trend} />}
        {alert && (
          <span className="flex h-2.5 w-2.5 mt-1">
            <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-black text-dark font-display leading-none mb-1">{value}</p>
        <p className="text-sm font-medium text-muted">{label}</p>
        {sub && <p className="text-xs text-muted/60 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

/* ── Custom Tooltip ── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-dark mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted">{p.name} :</span>
          <span className="font-semibold text-dark">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Skeleton ── */
function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-xl animate-pulse ${className}`} />
}

/* ── Main ── */
export default function DashboardHome() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get<Stats>('/dashboard/stats').then(r => r.data),
    refetchInterval: 60_000,
  })

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-72" />)}
        </div>
      </div>
    )
  }

  const s = data!

  /* Pie data */
  const posteData = Object.entries(s.candidatures.par_poste).map(([k, v]) => ({
    name: POSTE_LABELS[k as PosteSouhaite] ?? k, value: v,
  }))
  const serviceData = Object.entries(s.demandes.par_service).map(([k, v]) => ({
    name: SERVICE_LABELS[k as ServiceSouhaite] ?? k, value: v,
  }))

  /* Statut bar data */
  const statutData = [
    { name: 'À traiter', value: s.candidatures.par_statut['a_traiter'] ?? 0, fill: '#F59E0B' },
    { name: 'En cours', value: s.candidatures.par_statut['en_cours'] ?? 0, fill: '#3B82F6' },
    { name: 'Placé(e)', value: s.candidatures.par_statut['place'] ?? 0, fill: '#10B981' },
    { name: 'Archivé', value: s.candidatures.par_statut['archive'] ?? 0, fill: '#6B7280' },
  ]

  return (
    <div className="space-y-7">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black font-display text-dark">Tableau de bord</h1>
          <p className="text-muted text-sm mt-0.5 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium border border-emerald-100">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Système actif
          </span>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Candidatures"
          value={s.candidatures.total}
          sub={`+${s.candidatures.nouveaux_7j} cette semaine`}
          trend={s.candidatures.tendance_30j}
          color={COLORS.primary}
          bg="bg-primary/10"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <KpiCard
          label="Demandes clients"
          value={s.demandes.total}
          sub={`+${s.demandes.nouveaux_7j} cette semaine`}
          trend={s.demandes.tendance_30j}
          color={COLORS.accent}
          bg="bg-accent/10"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <KpiCard
          label="Messages reçus"
          value={s.messages.total}
          sub={`${s.messages.non_lus} non lu${s.messages.non_lus > 1 ? 's' : ''}`}
          trend={s.messages.tendance_30j}
          alert={s.messages.non_lus > 0}
          color={COLORS.blue}
          bg="bg-blue-50"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
        />
        <KpiCard
          label="À traiter"
          value={s.candidatures.a_traiter + s.demandes.nouvelles}
          sub={`${s.candidatures.a_traiter} candidatures · ${s.demandes.nouvelles} demandes`}
          color={COLORS.purple}
          bg="bg-purple-50"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* ── Graphique activité 7j ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold font-display text-dark">Activité des 7 derniers jours</h2>
            <p className="text-xs text-muted mt-0.5">Candidatures, demandes et messages reçus</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={s.graph_7j} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradC" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.15} />
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradD" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.15} />
                <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradM" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.15} />
                <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="candidatures" name="Candidatures" stroke={COLORS.primary} strokeWidth={2.5} fill="url(#gradC)" dot={{ r: 3, fill: COLORS.primary }} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="demandes" name="Demandes" stroke={COLORS.accent} strokeWidth={2.5} fill="url(#gradD)" dot={{ r: 3, fill: COLORS.accent }} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="messages" name="Messages" stroke={COLORS.blue} strokeWidth={2.5} fill="url(#gradM)" dot={{ r: 3, fill: COLORS.blue }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Ligne 3 graphiques ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Statut candidatures — barre */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold font-display text-dark mb-1">Statut candidatures</h3>
          <p className="text-xs text-muted mb-5">Répartition actuelle</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={statutData} layout="vertical" margin={{ left: 0, right: 10 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#555' }} axisLine={false} tickLine={false} width={72} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Total" radius={[0, 6, 6, 0]}>
                {statutData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Postes demandés — donut */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold font-display text-dark mb-1">Postes recherchés</h3>
          <p className="text-xs text-muted mb-4">Candidatures par type</p>
          {posteData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={posteData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                    {posteData.map((_, i) => <Cell key={i} fill={STATUT_COLORS[i % STATUT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {posteData.slice(0, 4).map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: STATUT_COLORS[i % STATUT_COLORS.length] }} />
                      <span className="text-muted truncate max-w-[110px]">{p.name}</span>
                    </div>
                    <span className="font-semibold text-dark">{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted text-sm">Aucune donnée</div>
          )}
        </div>

        {/* Services — donut */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold font-display text-dark mb-1">Services demandés</h3>
          <p className="text-xs text-muted mb-4">Demandes par type</p>
          {serviceData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={serviceData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                    {serviceData.map((_, i) => <Cell key={i} fill={SERVICE_PIE_COLORS[i % SERVICE_PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {serviceData.slice(0, 4).map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: SERVICE_PIE_COLORS[i % SERVICE_PIE_COLORS.length] }} />
                      <span className="text-muted truncate max-w-[110px]">{p.name}</span>
                    </div>
                    <span className="font-semibold text-dark">{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted text-sm">Aucune donnée</div>
          )}
        </div>
      </div>

      {/* ── Activité récente ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Dernières candidatures */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50/60 rounded-t-2xl">
            <h3 className="font-bold font-display text-dark text-sm">Candidatures récentes</h3>
            <Link to="/admin/candidatures" className="text-xs text-primary hover:underline font-medium">Tout voir →</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {s.dernieres_candidatures.length === 0 ? (
              <p className="text-center text-muted text-sm py-8">Aucune candidature</p>
            ) : s.dernieres_candidatures.map(c => (
              <Link key={c.id} to={`/admin/candidatures/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface/60 transition-colors group">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {c.nomComplet[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark truncate group-hover:text-primary transition-colors">{c.nomComplet}</p>
                  <p className="text-xs text-muted truncate">{POSTE_LABELS[c.posteSouhaite] ?? c.posteSouhaite} · {c.ville}</p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge status={c.statut} />
                  <p className="text-[10px] text-muted mt-1">{timeAgo(c.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Dernières demandes */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50/60 rounded-t-2xl">
            <h3 className="font-bold font-display text-dark text-sm">Demandes récentes</h3>
            <Link to="/admin/demandes" className="text-xs text-primary hover:underline font-medium">Tout voir →</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {s.dernieres_demandes.length === 0 ? (
              <p className="text-center text-muted text-sm py-8">Aucune demande</p>
            ) : s.dernieres_demandes.map(d => (
              <Link key={d.id} to={`/admin/demandes/${d.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface/60 transition-colors group">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center text-accent font-bold text-xs shrink-0">
                  {d.nomRaisonSociale[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark truncate group-hover:text-primary transition-colors">{d.nomRaisonSociale}</p>
                  <p className="text-xs text-muted">{SERVICE_LABELS[d.serviceSouhaite] ?? d.serviceSouhaite}</p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge status={d.statut} />
                  <p className="text-[10px] text-muted mt-1">{timeAgo(d.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Derniers messages */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50/60 rounded-t-2xl">
            <h3 className="font-bold font-display text-dark text-sm">Messages récents</h3>
            <Link to="/admin/messages" className="text-xs text-primary hover:underline font-medium">Tout voir →</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {s.derniers_messages.length === 0 ? (
              <p className="text-center text-muted text-sm py-8">Aucun message</p>
            ) : s.derniers_messages.map(m => (
              <Link key={m.id} to={`/admin/messages/${m.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface/60 transition-colors group">
                <div className="relative shrink-0">
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 font-bold text-xs">
                    {m.nom[0]}
                  </div>
                  {m.statut === 'non_lu' && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate group-hover:text-primary transition-colors ${m.statut === 'non_lu' ? 'font-bold text-dark' : 'font-medium text-dark'}`}>{m.nom}</p>
                  <p className="text-xs text-muted truncate">{m.sujet}</p>
                </div>
                <p className="text-[10px] text-muted shrink-0">{timeAgo(m.createdAt)}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}

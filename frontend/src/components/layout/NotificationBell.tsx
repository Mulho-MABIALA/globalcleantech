import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useNotifications,
  useNotificationStats,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type Notification,
  type TypeNotification,
} from '../../hooks/useNotifications'
import { usePushNotifications } from '../../hooks/usePushNotifications'

const TYPE_STYLES: Record<TypeNotification, { emoji: string; bg: string; text: string }> = {
  candidature: { emoji: '🧑‍💼', bg: 'bg-primary/10', text: 'text-primary' },
  candidature_statut: { emoji: '🔄', bg: 'bg-blue-100', text: 'text-blue-600' },
  demande: { emoji: '📋', bg: 'bg-accent/10', text: 'text-accent' },
  message: { emoji: '✉️', bg: 'bg-purple-100', text: 'text-purple-600' },
  placement: { emoji: '✅', bg: 'bg-emerald-100', text: 'text-emerald-600' },
  systeme: { emoji: '⚙️', bg: 'bg-gray-100', text: 'text-gray-600' },
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  return `il y a ${d} j`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { data: stats } = useNotificationStats()
  const { data: list } = useNotifications({ limit: 10 })
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const push = usePushNotifications()

  const nonLues = stats?.nonLues ?? 0

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const go = (n: Notification) => {
    if (!n.lu) markRead.mutate(n.id)
    setOpen(false)
    if (n.lien) navigate(n.lien)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {nonLues > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
            {nonLues > 9 ? '9+' : nonLues}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-96 max-w-[90vw] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-dark text-sm">Notifications</p>
            {nonLues > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs font-medium text-primary hover:underline"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {!list?.data.length ? (
              <div className="p-6 text-center text-muted text-sm">Aucune notification pour le moment.</div>
            ) : (
              list.data.map(n => {
                const style = TYPE_STYLES[n.type] ?? TYPE_STYLES.systeme
                return (
                  <button
                    key={n.id}
                    onClick={() => go(n)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${!n.lu ? 'bg-primary/[0.03]' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm ${style.bg} ${style.text}`}>
                      {style.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-dark truncate">{n.titre}</p>
                      <p className="text-xs text-muted line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.lu && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0 mt-1.5" />}
                  </button>
                )
              })
            )}
          </div>

          {push.supported && !push.subscribed && push.permission !== 'denied' && (
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => push.subscribe()}
                disabled={push.loading}
                className="w-full text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg py-2 transition-colors disabled:opacity-50"
              >
                {push.loading ? 'Activation…' : '🔔 Activer les notifications push'}
              </button>
            </div>
          )}
          {push.supported && push.permission === 'denied' && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-[11px] text-muted text-center">
                Notifications push bloquées — autorisez-les dans les réglages du navigateur pour ce site.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

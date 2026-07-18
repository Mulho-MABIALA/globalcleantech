import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

const SUPPORTED = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window

/**
 * Gère l'abonnement aux notifications push navigateur pour le dashboard.
 * L'activation (subscribe) doit être déclenchée par un clic utilisateur (cloche).
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    SUPPORTED ? Notification.permission : 'denied'
  )
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!SUPPORTED) return
    navigator.serviceWorker.register('/sw.js').catch(() => {})

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {})
  }, [])

  const subscribe = useCallback(async () => {
    if (!SUPPORTED) return false
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return false

      const { data } = await api.get('/notifications/vapid-public-key')
      if (!data.publicKey) return false

      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.publicKey),
        })
      }

      await api.post('/notifications/subscribe', sub.toJSON())
      setSubscribed(true)
      return true
    } catch {
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    if (!SUPPORTED) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await api.delete('/notifications/subscribe', { data: { endpoint: sub.endpoint } })
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } finally {
      setLoading(false)
    }
  }, [])

  return { supported: SUPPORTED, permission, subscribed, loading, subscribe, unsubscribe }
}

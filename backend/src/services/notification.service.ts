import webpush from 'web-push'
import { PrismaClient, TypeNotification } from '@prisma/client'

const prisma = new PrismaClient()

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@globalcleantechsn.com'

/** Le push web est-il configuré ? (clés VAPID présentes) */
export function pushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC && VAPID_PRIVATE)
}

if (pushConfigured()) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC as string, VAPID_PRIVATE as string)
}

export function getVapidPublicKey(): string | null {
  return VAPID_PUBLIC || null
}

interface NotificationInput {
  type: TypeNotification
  titre: string
  message: string
  lien?: string
}

/**
 * Envoie la notification push à tous les abonnés enregistrés (équipe admin/gestionnaire).
 * Nettoie automatiquement les abonnements expirés/invalides (410/404).
 */
async function pushToAllSubscribers(payload: { titre: string; message: string; lien?: string }) {
  if (!pushConfigured()) {
    console.warn('[push] Clés VAPID non configurées (VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY) — push non envoyé.')
    return
  }

  const subs = await prisma.pushSubscription.findMany()
  if (subs.length === 0) return

  const body = JSON.stringify({
    title: payload.titre,
    body: payload.message,
    url: payload.lien || '/admin/dashboard',
  })

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        )
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          // Abonnement expiré ou révoqué côté navigateur : on le supprime.
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
        } else {
          console.error('[push] Échec d\'envoi :', err)
        }
      }
    })
  )
}

/**
 * Crée une notification interne (visible dans la cloche du dashboard) et
 * déclenche en parallèle l'envoi du push navigateur. Ne bloque jamais l'appelant.
 */
export async function createNotification(data: NotificationInput) {
  try {
    const notif = await prisma.notification.create({ data })
    pushToAllSubscribers({ titre: data.titre, message: data.message, lien: data.lien }).catch((e) =>
      console.error('[push] Erreur envoi:', e)
    )
    return notif
  } catch (err) {
    console.error('[notification] Erreur création :', err)
    return null
  }
}

import { api } from '../services/api'
import { POSTE_LABELS, EXPERIENCE_LABELS, type Candidature } from '../types/candidature'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function loadCandidaturePhoto(photoPath: string): Promise<HTMLImageElement | null> {
  try {
    const parts = photoPath.replace(/\\/g, '/').split('/')
    const filename = parts.pop()
    const folder = parts.join('/')
    if (!filename || !folder) return null
    const res = await api.get(`/uploads/${folder}/${filename}`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const img = await loadImage(url)
    URL.revokeObjectURL(url)
    return img
  } catch {
    return null
  }
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

interface AfficheOptions {
  candidature: Candidature
  signatureDataUrl: string
}

const W = 900
const H = 1250

/**
 * Compose un visuel "affiche" du candidat (photo, nom, poste, ville,
 * expérience, disponibilité, logo, signature admin) sur un canvas offscreen
 * et retourne un PNG en dataURL.
 */
export async function generateAffiche({ candidature: c, signatureDataUrl }: AfficheOptions): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas non supporté par ce navigateur.')

  // Fond
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  // Bandeau d'en-tête
  ctx.fillStyle = '#1A7F4B'
  ctx.fillRect(0, 0, W, 200)

  try {
    const logo = await loadImage('/logo.png')
    ctx.save()
    ctx.beginPath()
    ctx.arc(100, 100, 50, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.drawImage(logo, 50, 50, 100, 100)
    ctx.restore()
  } catch {
    // logo optionnel — on continue sans si indisponible
  }

  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.font = '700 40px Arial, sans-serif'
  ctx.fillText('Global Clean Tech', 170, 95)
  ctx.font = '400 20px Arial, sans-serif'
  ctx.fillStyle = '#d7f0e2'
  ctx.fillText('Propreté · Qualité · Durabilité', 170, 130)

  // Photo (ou initiale si absente/illisible)
  const photoSize = 380
  const photoX = (W - photoSize) / 2
  const photoY = 250
  const photo = c.photoPath ? await loadCandidaturePhoto(c.photoPath) : null

  ctx.save()
  roundedRectPath(ctx, photoX, photoY, photoSize, photoSize, 24)
  ctx.clip()
  if (photo) {
    const scale = Math.max(photoSize / photo.width, photoSize / photo.height)
    const sw = photoSize / scale
    const sh = photoSize / scale
    const sx = (photo.width - sw) / 2
    const sy = (photo.height - sh) / 2
    ctx.drawImage(photo, sx, sy, sw, sh, photoX, photoY, photoSize, photoSize)
  } else {
    ctx.fillStyle = '#E8F5EE'
    ctx.fillRect(photoX, photoY, photoSize, photoSize)
    ctx.fillStyle = '#1A7F4B'
    ctx.font = '700 140px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(c.nomComplet.trim()[0]?.toUpperCase() || '?', photoX + photoSize / 2, photoY + photoSize / 2 + 45)
  }
  ctx.restore()

  ctx.strokeStyle = '#1A7F4B'
  ctx.lineWidth = 4
  roundedRectPath(ctx, photoX, photoY, photoSize, photoSize, 24)
  ctx.stroke()

  // Nom
  ctx.fillStyle = '#2C2C2C'
  ctx.textAlign = 'center'
  ctx.font = '700 46px Arial, sans-serif'
  ctx.fillText(c.nomComplet, W / 2, photoY + photoSize + 70)

  // Badge poste
  const posteLabel = POSTE_LABELS[c.posteSouhaite] ?? c.posteSouhaite
  ctx.font = '600 26px Arial, sans-serif'
  const badgeWidth = ctx.measureText(posteLabel).width + 60
  const badgeX = (W - badgeWidth) / 2
  const badgeY = photoY + photoSize + 100
  ctx.fillStyle = '#E8F5EE'
  roundedRectPath(ctx, badgeX, badgeY, badgeWidth, 50, 25)
  ctx.fill()
  ctx.fillStyle = '#1A7F4B'
  ctx.fillText(posteLabel, W / 2, badgeY + 34)

  // Infos complémentaires
  ctx.fillStyle = '#555555'
  ctx.font = '400 26px Arial, sans-serif'
  const infoY = badgeY + 100
  const infos = [
    `📍 ${c.ville}`,
    `🎓 Expérience : ${EXPERIENCE_LABELS[c.experience] ?? c.experience}`,
    `🗓 Disponibilité : ${c.disponibilite}`,
  ]
  infos.forEach((line, i) => ctx.fillText(line, W / 2, infoY + i * 42))

  // Signature de l'administrateur
  if (signatureDataUrl) {
    try {
      const sigImg = await loadImage(signatureDataUrl)
      const sigW = 260
      const sigH = 100
      const sigX = W - sigW - 80
      const sigY = H - 220
      ctx.drawImage(sigImg, sigX, sigY, sigW, sigH)
      ctx.strokeStyle = '#cccccc'
      ctx.beginPath()
      ctx.moveTo(sigX, sigY + sigH + 5)
      ctx.lineTo(sigX + sigW, sigY + sigH + 5)
      ctx.stroke()
      ctx.fillStyle = '#999999'
      ctx.font = '400 18px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Signature — Global Clean Tech', sigX + sigW / 2, sigY + sigH + 30)
    } catch {
      // signature illisible — on continue sans
    }
  }

  // Pied de page
  ctx.fillStyle = '#999999'
  ctx.font = '400 18px Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`Global Clean Tech · Thiès, Sénégal · ${new Date().toLocaleDateString('fr-FR')}`, 60, H - 60)

  return canvas.toDataURL('image/png')
}

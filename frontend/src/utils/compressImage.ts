/**
 * Réduit une photo prise au téléphone (souvent 3 à 8 Mo) avant l'envoi :
 * redimensionnement à `maxDim` px max + ré-encodage JPEG. Convertit aussi les
 * HEIC quand le navigateur sait les lire (Safari/iPhone). En cas d'échec, le
 * fichier d'origine est renvoyé tel quel.
 */
export async function compressImage(file: File, maxDim = 1600, quality = 0.8): Promise<File> {
  if (!isImage(file)) return file
  const isWebFormat = /^image\/(jpe?g|png|webp)$/i.test(file.type)
  if (isWebFormat && file.size <= 600 * 1024) return file

  try {
    const img = await loadImage(file)
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.fillStyle = '#fff' // fond blanc pour les PNG transparents
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob) return file
    if (isWebFormat && blob.size >= file.size) return file

    const base = file.name.replace(/\.[^.]+$/, '') || 'photo'
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file
  }
}

export function isImage(file: File): boolean {
  return file.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image illisible')) }
    img.src = url
  })
}

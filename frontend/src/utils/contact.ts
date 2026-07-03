/** Construit un lien wa.me à partir d'un numéro local ou international (Sénégal par défaut). */
export function whatsappLink(telephone: string, message?: string) {
  let digits = telephone.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.length === 9 && !digits.startsWith('221')) digits = `221${digits}`
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${digits}${text}`
}

import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal'
import SignaturePad, { type SignaturePadHandle } from '../ui/SignaturePad'
import { api } from '../../services/api'
import { generateAffiche } from '../../utils/affiche'
import type { Candidature } from '../../types/candidature'

interface Props {
  open: boolean
  onClose: () => void
  candidature: Candidature
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function EnvoyerAfficheModal({ open, onClose, candidature: c }: Props) {
  const [dest, setDest] = useState<'candidat' | 'autre'>(c.email ? 'candidat' : 'autre')
  const [email, setEmail] = useState(c.email || '')
  const [sending, setSending] = useState(false)
  const sigRef = useRef<SignaturePadHandle>(null)

  const handleClose = () => {
    if (sending) return
    onClose()
  }

  const handleSend = async () => {
    if (!email || !EMAIL_RE.test(email)) {
      toast.error('Adresse email destinataire invalide.')
      return
    }
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("Merci de signer avant d'envoyer.")
      return
    }

    setSending(true)
    try {
      const image = await generateAffiche({ candidature: c, signatureDataUrl: sigRef.current.toDataURL() })
      await api.post(`/candidatures/${c.id}/affiche`, { email, image })
      toast.success('Affiche envoyée par email.')
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || "Échec de l'envoi de l'affiche.")
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Envoyer l'affiche par email" maxWidth="lg">
      <div className="space-y-5">
        <div>
          <label className="form-label">Destinataire</label>
          <div className="flex flex-col gap-2 mb-2">
            <label className={`flex items-center gap-2 text-sm ${!c.email ? 'text-gray-300' : 'text-dark'}`}>
              <input
                type="radio"
                checked={dest === 'candidat'}
                disabled={!c.email}
                onChange={() => { setDest('candidat'); setEmail(c.email || '') }}
              />
              Le candidat {c.email ? `(${c.email})` : '(aucun email renseigné)'}
            </label>
            <label className="flex items-center gap-2 text-sm text-dark">
              <input
                type="radio"
                checked={dest === 'autre'}
                onChange={() => { setDest('autre'); setEmail('') }}
              />
              Un client / autre adresse
            </label>
          </div>
          {dest === 'autre' && (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="form-input"
              autoFocus
            />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="form-label mb-0">Signature de l'administrateur</label>
            <button type="button" onClick={() => sigRef.current?.clear()} className="text-xs font-medium text-muted hover:text-dark">
              Effacer
            </button>
          </div>
          <SignaturePad ref={sigRef} height={150} />
          <p className="text-xs text-muted mt-1.5">Dessinez votre signature à la souris ou au doigt — elle sera intégrée à l'affiche avant l'envoi.</p>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <button onClick={handleClose} disabled={sending} className="btn-ghost">Annuler</button>
          <button onClick={handleSend} disabled={sending} className="btn-primary">
            {sending ? 'Génération et envoi...' : "Générer et envoyer l'affiche"}
          </button>
        </div>
      </div>
    </Modal>
  )
}

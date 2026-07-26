import React, { useState } from 'react'
import Modal from '../ui/Modal'
import toast from 'react-hot-toast'
import { useCreatePlacement } from '../../hooks/usePlacements'
import { useDemandes } from '../../hooks/useDemandes'

interface Props {
  open: boolean
  onClose: () => void
  candidatureId: number
  candidatNom: string
}

export default function CreatePlacementModal({ open, onClose, candidatureId, candidatNom }: Props) {
  const [demandeId, setDemandeId] = useState('')
  const [dateDebut, setDateDebut] = useState(() => new Date().toISOString().slice(0, 10))
  const [dateFin, setDateFin] = useState('')
  const [salaire, setSalaire] = useState('')
  const [notes, setNotes] = useState('')

  const createMut = useCreatePlacement()
  // On ne propose que les demandes clients de type "placement" pas encore clôturées.
  const { data: demandesData } = useDemandes({ service: 'placement', limit: 100 })
  const demandesOuvertes = (demandesData?.data ?? []).filter((d: { statut: string }) => d.statut !== 'cloturee')

  const reset = () => {
    setDemandeId('')
    setDateDebut(new Date().toISOString().slice(0, 10))
    setDateFin('')
    setSalaire('')
    setNotes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dateDebut) { toast.error('La date de début est requise.'); return }
    try {
      await createMut.mutateAsync({
        candidatureId,
        demandeId: demandeId ? Number(demandeId) : undefined,
        dateDebut,
        dateFin: dateFin || undefined,
        salaire: salaire || undefined,
        notes: notes || undefined,
      })
      toast.success('Placement enregistré — le candidat est marqué "Placé(e)".')
      reset()
      onClose()
    } catch {
      toast.error("Erreur lors de l'enregistrement du placement.")
    }
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Créer un placement">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted">
          Confirmer le placement de <strong className="text-dark">{candidatNom}</strong> chez un client ou un particulier.
          Le statut de la candidature passera automatiquement à "Placé(e)".
        </p>

        <div>
          <label className="form-label">Client (demande liée) <span className="text-gray-400 font-normal">(optionnel)</span></label>
          <select value={demandeId} onChange={(e) => setDemandeId(e.target.value)} className="form-input">
            <option value="">— Particulier direct / non lié à une demande —</option>
            {demandesOuvertes.map((d: { id: number; nomRaisonSociale: string }) => (
              <option key={d.id} value={d.id}>{d.nomRaisonSociale}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Date de début <span className="text-red-500">*</span></label>
            <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="form-input" required />
          </div>
          <div>
            <label className="form-label">Date de fin <span className="text-gray-400 font-normal">(optionnel)</span></label>
            <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="form-input" min={dateDebut} />
          </div>
        </div>

        <div>
          <label className="form-label">Salaire <span className="text-gray-400 font-normal">(optionnel)</span></label>
          <input value={salaire} onChange={(e) => setSalaire(e.target.value)} className="form-input" placeholder="Ex: 60 000 FCFA/mois" />
        </div>

        <div>
          <label className="form-label">Notes <span className="text-gray-400 font-normal">(optionnel)</span></label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="form-input resize-none" placeholder="Détails du placement..." />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => { reset(); onClose() }} className="btn-ghost">Annuler</button>
          <button type="submit" disabled={createMut.isPending} className="btn-primary px-6 disabled:opacity-60">
            {createMut.isPending ? 'Enregistrement...' : 'Confirmer le placement'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

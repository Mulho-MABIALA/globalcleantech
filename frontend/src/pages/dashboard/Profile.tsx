import React, { forwardRef, useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, UseFormRegisterReturn } from 'react-hook-form'
import toast from 'react-hot-toast'
import { api } from '../../services/api'
import { useMe, useAvatarUrl } from '../../hooks/useMe'

const MAX_AVATAR_SIZE_MB = 2

interface ProfileForm {
  name: string
  email: string
}

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const PasswordInput = forwardRef<HTMLInputElement, { label: string; error?: string } & UseFormRegisterReturn>(function PasswordInput({ label, error, ...register }, ref) {
  const [visible, setVisible] = useState(false)
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="relative">
        <input ref={ref} type={visible ? 'text' : 'password'} className="form-input pr-10" placeholder="••••••••" {...register} />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {visible ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          )}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
})

export default function Profile() {
  const qc = useQueryClient()
  const { data: user, isLoading } = useMe()
  const avatarUrl = useAvatarUrl(user?.avatarPath)
  const fileRef = useRef<HTMLInputElement>(null)

  const profileForm = useForm<ProfileForm>()
  const passwordForm = useForm<PasswordForm>()

  useEffect(() => {
    if (user) profileForm.reset({ name: user.name, email: user.email })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateMut = useMutation({
    mutationFn: (d: ProfileForm) => api.patch('/auth/me', d).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] })
      toast.success('Profil mis à jour.')
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message ?? 'Erreur lors de la mise à jour.'),
  })

  const passwordMut = useMutation({
    mutationFn: (d: PasswordForm) => api.patch('/auth/me/password', { currentPassword: d.currentPassword, newPassword: d.newPassword }).then(r => r.data),
    onSuccess: () => {
      toast.success('Mot de passe modifié avec succès.')
      passwordForm.reset()
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message ?? 'Erreur lors du changement de mot de passe.'),
  })

  const avatarMut = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('avatar', file)
      return api.post('/auth/me/avatar', fd).then(r => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] })
      toast.success('Photo de profil mise à jour.')
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message ?? 'Erreur lors de l\'envoi de la photo.'),
  })

  const removeAvatarMut = useMutation({
    mutationFn: () => api.delete('/auth/me/avatar').then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] })
      toast.success('Photo de profil supprimée.')
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message ?? 'Erreur lors de la suppression.'),
  })

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('La photo doit être un fichier JPG, PNG ou WEBP.')
      return
    }
    if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
      toast.error(`La photo ne doit pas dépasser ${MAX_AVATAR_SIZE_MB} Mo.`)
      return
    }
    avatarMut.mutate(file)
  }

  if (isLoading || !user) {
    return <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  const isDirty = profileForm.formState.isDirty
  const pwErrors = passwordForm.formState.errors

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black font-display text-dark">Mon profil</h1>
        <p className="text-muted text-sm mt-0.5">Consultez et modifiez vos informations de connexion</p>
      </div>

      {/* Carte identité */}
      <div className="card p-6">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              title="Changer la photo de profil"
              className="group relative w-20 h-20 rounded-2xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center text-white text-3xl font-black font-display">
                  {user.name[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
            </button>
            {avatarMut.isPending && (
              <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold font-display text-dark truncate">{user.name}</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {user.role === 'admin' ? '👑 Admin' : '🔧 Gestionnaire'}
              </span>
            </div>
            <p className="text-muted text-sm truncate">{user.email}</p>
            <p className="text-xs text-gray-400 mt-1">
              Compte créé le {new Date(user.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={avatarMut.isPending}
                className="text-primary text-sm font-medium hover:underline disabled:opacity-50"
              >
                {avatarUrl ? 'Changer la photo' : 'Ajouter une photo'}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => removeAvatarMut.mutate()}
                  disabled={removeAvatarMut.isPending}
                  className="text-red-500 text-sm hover:underline disabled:opacity-50"
                >
                  {removeAvatarMut.isPending ? 'Suppression...' : 'Supprimer la photo'}
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">JPG, PNG ou WEBP — {MAX_AVATAR_SIZE_MB} Mo max.</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onFileSelected}
          />
        </div>
      </div>

      {/* Informations personnelles */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <div>
            <h3 className="font-bold font-display text-dark">Informations personnelles</h3>
            <p className="text-xs text-muted">Votre nom et votre adresse de connexion</p>
          </div>
        </div>

        <form onSubmit={profileForm.handleSubmit(d => updateMut.mutate(d))} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nom complet</label>
              <input className="form-input" {...profileForm.register('name', { required: 'Le nom est requis.' })} placeholder="Prénom Nom" />
              {profileForm.formState.errors.name && <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className="form-label">Adresse email</label>
              <input type="email" className="form-input" {...profileForm.register('email', { required: 'L\'email est requis.' })} placeholder="email@example.com" />
              {profileForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.email.message}</p>}
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={updateMut.isPending || !isDirty} className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {updateMut.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>

      {/* Sécurité */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <div>
            <h3 className="font-bold font-display text-dark">Changer le mot de passe</h3>
            <p className="text-xs text-muted">Choisissez un mot de passe fort d'au moins 8 caractères</p>
          </div>
        </div>

        <form onSubmit={passwordForm.handleSubmit(d => passwordMut.mutate(d))} className="space-y-4">
          <PasswordInput
            label="Mot de passe actuel"
            error={pwErrors.currentPassword?.message}
            {...passwordForm.register('currentPassword', { required: 'Le mot de passe actuel est requis.' })}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <PasswordInput
              label="Nouveau mot de passe"
              error={pwErrors.newPassword?.message}
              {...passwordForm.register('newPassword', {
                required: 'Le nouveau mot de passe est requis.',
                minLength: { value: 8, message: 'Au moins 8 caractères.' },
              })}
            />
            <PasswordInput
              label="Confirmer le nouveau mot de passe"
              error={pwErrors.confirmPassword?.message}
              {...passwordForm.register('confirmPassword', {
                required: 'La confirmation est requise.',
                validate: v => v === passwordForm.getValues('newPassword') || 'Les mots de passe ne correspondent pas.',
              })}
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={passwordMut.isPending} className="btn-primary text-sm disabled:opacity-50">
              {passwordMut.isPending ? 'Modification...' : 'Modifier le mot de passe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

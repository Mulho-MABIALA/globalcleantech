import React from 'react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import Modal from '../../components/ui/Modal'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PERMISSION_MODULES, PermissionModule, PermissionLevel, PermissionsMap } from '../../hooks/useMe'

const MODULE_LABELS: Record<PermissionModule, string> = {
  candidatures: 'Candidatures',
  demandes: 'Demandes clients',
  placements: 'Placements',
  messages: 'Messages',
  temoignages: 'Témoignages',
  newsletter: 'Newsletter',
  actualites: 'Actualités',
  services: 'Services du site',
  contenu: 'Textes du site',
  publicites: 'Publicités',
  utilisateurs: 'Utilisateurs',
}

const MODULE_ICONS: Record<PermissionModule, string> = {
  candidatures: '👥',
  demandes: '📋',
  placements: '✅',
  messages: '💬',
  temoignages: '⭐',
  newsletter: '📰',
  actualites: '🗞️',
  services: '⚡',
  contenu: '📝',
  publicites: '📣',
  utilisateurs: '🔐',
}

// Reprend le même regroupement que la barre latérale, pour que la matrice de
// permissions soit immédiatement lisible par rapport aux pages du dashboard.
const PERMISSION_GROUPS: { title: string; modules: PermissionModule[] }[] = [
  { title: 'Activité', modules: ['candidatures', 'demandes', 'placements'] },
  { title: 'Communication', modules: ['messages', 'temoignages', 'newsletter'] },
  { title: 'Contenu du site', modules: ['actualites', 'services', 'contenu', 'publicites'] },
  { title: 'Administration', modules: ['utilisateurs'] },
]

const LEVEL_STYLES: Record<PermissionLevel, string> = {
  none: 'bg-gray-100 border-gray-200 text-gray-500',
  read: 'bg-amber-50 border-amber-200 text-amber-700',
  edit: 'bg-emerald-50 border-emerald-300 text-emerald-700',
}

// Par défaut, un nouveau gestionnaire a accès complet sauf à la gestion des utilisateurs
// (réservée aux admins, sauf attribution explicite).
const DEFAULT_PERMISSIONS: PermissionsMap = PERMISSION_MODULES.reduce((acc, m) => {
  acc[m] = m === 'utilisateurs' ? 'none' : 'edit'
  return acc
}, {} as PermissionsMap)

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'gestionnaire'
  permissions: PermissionsMap | null
  createdAt: string
}

interface UserForm {
  name: string
  email: string
  password?: string
  role: 'admin' | 'gestionnaire'
  permissions: PermissionsMap
}

function useUsers() {
  return useQuery<User[]>({ queryKey: ['users'], queryFn: () => api.get('/users').then(r => r.data) })
}

function PermissionRow({ form, module }: { form: ReturnType<typeof useForm<UserForm>>; module: PermissionModule }) {
  const value = (form.watch(`permissions.${module}`) as PermissionLevel | undefined) ?? 'none'
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 bg-white">
      <span className="flex items-center gap-2 min-w-0 text-sm text-dark">
        <span className="text-base leading-none">{MODULE_ICONS[module]}</span>
        <span className="truncate">{MODULE_LABELS[module]}</span>
      </span>
      <select
        className={`text-xs font-semibold rounded-full border pl-3 pr-7 py-1.5 shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/30 ${LEVEL_STYLES[value]}`}
        {...form.register(`permissions.${module}` as const)}
      >
        <option value="none">Aucun accès</option>
        <option value="read">Lecture seule</option>
        <option value="edit">Peut modifier</option>
      </select>
    </div>
  )
}

function PermissionsMatrix({ form }: { form: ReturnType<typeof useForm<UserForm>> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {PERMISSION_GROUPS.map(group => (
        <div key={group.title} className="border rounded-xl overflow-hidden self-start">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted bg-gray-50 border-b">{group.title}</p>
          <div className="divide-y divide-gray-100">
            {group.modules.map(mod => <PermissionRow key={mod} form={form} module={mod} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

function PermissionsLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300" /> Aucun accès</span>
      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-300" /> Lecture seule</span>
      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Peut modifier</span>
    </div>
  )
}

function countAccessible(permissions: PermissionsMap | null): number {
  if (!permissions) return 0
  return PERMISSION_MODULES.filter(m => (permissions[m] ?? 'none') !== 'none').length
}

export default function Users() {
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const qc = useQueryClient()
  const { data: users, isLoading } = useUsers()

  const form = useForm<UserForm>({ defaultValues: { role: 'gestionnaire', permissions: DEFAULT_PERMISSIONS } })
  const roleWatch = form.watch('role')

  const createMut = useMutation({
    mutationFn: (d: UserForm) => api.post('/users', d).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Utilisateur créé.'); setShowCreate(false); form.reset() },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserForm> }) => api.patch(`/users/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Utilisateur mis à jour.'); setEditUser(null) },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Utilisateur supprimé.'); setDeleteUser(null) },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })

  const openEdit = (u: User) => {
    setEditUser(u)
    form.reset({
      name: u.name,
      email: u.email,
      role: u.role,
      password: '',
      permissions: u.role === 'admin' ? DEFAULT_PERMISSIONS : (u.permissions ?? DEFAULT_PERMISSIONS),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black font-display text-dark">Utilisateurs</h1>
          <p className="text-muted text-sm mt-0.5">Gestion des accès au dashboard</p>
        </div>
        <button onClick={() => { setShowCreate(true); form.reset({ role: 'gestionnaire', permissions: DEFAULT_PERMISSIONS }) }} className="btn-primary text-sm">
          + Nouvel utilisateur
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Accès</th>
                <th>Créé le</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users?.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm font-bold shrink-0">
                        {u.name[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-dark">{u.name}</span>
                    </div>
                  </td>
                  <td className="text-muted">{u.email}</td>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {u.role === 'admin' ? '👑 Admin' : '🔧 Gestionnaire'}
                    </span>
                  </td>
                  <td className="text-muted whitespace-nowrap">
                    {u.role === 'admin' ? 'Toutes les pages' : `${countAccessible(u.permissions)} / ${PERMISSION_MODULES.length} pages`}
                  </td>
                  <td className="text-muted whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(u)} className="table-action">Modifier</button>
                      <button onClick={() => setDeleteUser(u)} className="table-action-danger">Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users?.length === 0 && (
            <div className="text-center py-12 text-muted">
              <p className="font-medium">Aucun utilisateur</p>
            </div>
          )}
        </div>
      )}

      {/* Modal création */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouvel utilisateur" maxWidth="xl">
        <form onSubmit={form.handleSubmit(d => createMut.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nom complet</label>
              <input className="form-input" {...form.register('name', { required: true })} placeholder="Prénom Nom" />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" {...form.register('email', { required: true })} placeholder="email@example.com" />
            </div>
            <div>
              <label className="form-label">Mot de passe (min. 8 caractères)</label>
              <input type="password" className="form-input" {...form.register('password', { required: true, minLength: 8 })} placeholder="••••••••" />
            </div>
            <div>
              <label className="form-label">Rôle</label>
              <select className="form-input" {...form.register('role')}>
                <option value="gestionnaire">Gestionnaire</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {roleWatch === 'admin' ? (
            <p className="text-sm text-muted bg-purple-50 border border-purple-100 rounded-xl px-3 py-2.5">
              👑 Les administrateurs ont automatiquement accès à toutes les pages.
            </p>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <label className="form-label !mb-0">Permissions par page</label>
                <PermissionsLegend />
              </div>
              <PermissionsMatrix form={form} />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost">Annuler</button>
            <button type="submit" disabled={createMut.isPending} className="btn-primary">
              {createMut.isPending ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal édition */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Modifier l'utilisateur" maxWidth="xl">
        <form onSubmit={form.handleSubmit(d => editUser && updateMut.mutate({ id: editUser.id, data: d }))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nom complet</label>
              <input className="form-input" {...form.register('name', { required: true })} />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" {...form.register('email', { required: true })} />
            </div>
            <div>
              <label className="form-label">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
              <input type="password" className="form-input" {...form.register('password')} placeholder="••••••••" />
            </div>
            <div>
              <label className="form-label">Rôle</label>
              <select className="form-input" {...form.register('role')}>
                <option value="gestionnaire">Gestionnaire</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {roleWatch === 'admin' ? (
            <p className="text-sm text-muted bg-purple-50 border border-purple-100 rounded-xl px-3 py-2.5">
              👑 Les administrateurs ont automatiquement accès à toutes les pages.
            </p>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <label className="form-label !mb-0">Permissions par page</label>
                <PermissionsLegend />
              </div>
              <PermissionsMatrix form={form} />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditUser(null)} className="btn-ghost">Annuler</button>
            <button type="submit" disabled={updateMut.isPending} className="btn-primary">
              {updateMut.isPending ? 'Mise à jour...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal suppression */}
      <Modal open={!!deleteUser} onClose={() => setDeleteUser(null)} title="Supprimer l'utilisateur">
        <p className="text-muted mb-2">Voulez-vous vraiment supprimer <strong>{deleteUser?.name}</strong> ?</p>
        <p className="text-sm text-red-600 mb-6">Cette action est irréversible.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteUser(null)} className="btn-ghost">Annuler</button>
          <button onClick={() => deleteUser && deleteMut.mutate(deleteUser.id)} disabled={deleteMut.isPending}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm font-medium">
            {deleteMut.isPending ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

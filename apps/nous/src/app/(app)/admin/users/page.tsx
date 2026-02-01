'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  UserPlus, Shield, User, Users, Edit, Trash2, 
  Key, Search, RefreshCw, ArrowLeft
} from 'lucide-react'

interface UserData {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  role: 'super_admin' | 'admin' | 'agent'
  user_metadata?: { name?: string }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load users')
      }
      
      setUsers(data.users || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete user')
      }
      
      loadUsers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const roleColors: Record<string, string> = {
    super_admin: 'bg-purple-500/20 text-purple-400',
    admin: 'bg-norv/20 text-norv',
    agent: 'bg-gray-500/20 text-gray-400'
  }

  const roleIcons: Record<string, any> = {
    super_admin: Shield,
    admin: Shield,
    agent: User
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-white">Users & Permissions</h1>
            <p className="text-white/60 mt-1">Manage user accounts and access levels</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-norv hover:bg-norv/80 text-white rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-navy-800/50 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-norv" />
            <div>
              <p className="text-2xl font-semibold text-white">{users.length}</p>
              <p className="text-sm text-white/50">Total Users</p>
            </div>
          </div>
        </div>
        <div className="bg-navy-800/50 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-2xl font-semibold text-white">
                {users.filter(u => u.role === 'super_admin').length}
              </p>
              <p className="text-sm text-white/50">Super Admins</p>
            </div>
          </div>
        </div>
        <div className="bg-navy-800/50 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-norv" />
            <div>
              <p className="text-2xl font-semibold text-white">
                {users.filter(u => u.role === 'admin').length}
              </p>
              <p className="text-sm text-white/50">Admins</p>
            </div>
          </div>
        </div>
        <div className="bg-navy-800/50 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-white/50" />
            <div>
              <p className="text-2xl font-semibold text-white">
                {users.filter(u => u.role === 'agent').length}
              </p>
              <p className="text-sm text-white/50">Agents</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email..."
            className="w-full pl-10 pr-4 py-2 bg-navy-800 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'super_admin', 'admin', 'agent'].map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === role
                  ? 'bg-norv/20 text-norv'
                  : 'bg-navy-800 text-white/60 hover:text-white'
              }`}
            >
              {role === 'all' ? 'All' : role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
        <button
          onClick={loadUsers}
          className="flex items-center gap-2 px-3 py-2 bg-navy-800 hover:bg-navy-700 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-navy-800/50 border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Last Login</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/50">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/50">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const RoleIcon = roleIcons[user.role] || User
                  return (
                    <tr key={user.id} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-navy-700 rounded-full flex items-center justify-center">
                            <RoleIcon className="w-4 h-4 text-white/60" />
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {user.user_metadata?.name || user.email.split('@')[0]}
                            </p>
                            <p className="text-xs text-white/40">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${roleColors[user.role]}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/50">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/50">
                        {user.last_sign_in_at 
                          ? new Date(user.last_sign_in_at).toLocaleString()
                          : 'Never'
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowEditModal(true)
                            }}
                            className="p-2 hover:bg-white/10 rounded transition-colors"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4 text-white/60" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowPasswordModal(true)
                            }}
                            className="p-2 hover:bg-white/10 rounded transition-colors"
                            title="Reset password"
                          >
                            <Key className="w-4 h-4 text-amber-400" />
                          </button>
                          {user.role !== 'super_admin' && (
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="p-2 hover:bg-white/10 rounded transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadUsers()
          }}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUser(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setSelectedUser(null)
            loadUsers()
          }}
        />
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && selectedUser && (
        <ResetPasswordModal
          user={selectedUser}
          onClose={() => {
            setShowPasswordModal(false)
            setSelectedUser(null)
          }}
          onSuccess={() => {
            setShowPasswordModal(false)
            setSelectedUser(null)
          }}
        />
      )}
    </div>
  )
}

// Create User Modal Component
function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'agent' | 'admin'>('agent')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-navy-800 border border-white/10 rounded-lg w-full max-w-md">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-medium text-white">Create New User</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@example.com"
                className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'agent' | 'admin')}
                className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-norv focus:outline-none"
              >
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="p-4 border-t border-white/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-norv hover:bg-norv/80 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit User Modal Component
function EditUserModal({ user, onClose, onSuccess }: { user: UserData; onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState(user.email)
  const [name, setName] = useState(user.user_metadata?.name || '')
  const [role, setRole] = useState(user.role)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user')
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-navy-800 border border-white/10 rounded-lg w-full max-w-md">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-medium text-white">Edit User</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-norv focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-norv focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                disabled={user.role === 'super_admin'}
                className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-norv focus:outline-none disabled:opacity-50"
              >
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              {user.role === 'super_admin' && (
                <p className="text-xs text-white/40 mt-1">Super admin role cannot be changed</p>
              )}
            </div>
          </div>
          <div className="p-4 border-t border-white/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-norv hover:bg-norv/80 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Reset Password Modal Component
function ResetPasswordModal({ user, onClose, onSuccess }: { user: UserData; onClose: () => void; onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      alert('Password has been reset successfully')
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-navy-800 border border-white/10 rounded-lg w-full max-w-md">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-medium text-white">Reset Password</h3>
          <p className="text-sm text-white/50 mt-1">For: {user.email}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm password"
                className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none"
              />
            </div>
          </div>
          <div className="p-4 border-t border-white/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg transition-colors disabled:opacity-50"
            >
              <Key className="w-4 h-4" />
              {saving ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

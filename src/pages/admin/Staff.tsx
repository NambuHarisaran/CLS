import React, { useEffect, useState, useMemo } from 'react'
import { collection, getDocs, updateDoc, doc, query, where, limit } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import AdminLayout from '../../components/AdminLayout'
import { UserDoc, Role } from '../../lib/types'
import { formatDate } from '../../lib/utils'
import { Search, UserCog, Shield, ShoppingBag, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function AdminStaff() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserDoc[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const load = async () => {
    const snap = await getDocs(collection(db, 'users'))
    setUsers(snap.docs.map((d) => d.data() as UserDoc))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return users
    const q = search.trim().toLowerCase()
    return users.filter((u) =>
      (u.email || '').toLowerCase().includes(q) ||
      (u.name || '').toLowerCase().includes(q)
    )
  }, [users, search])

  const handleRoleChange = async (uid: string, newRole: Role) => {
    if (uid === currentUser?.uid) { toast.error("Can't change your own role"); return }
    setUpdating(uid)
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole })
      toast.success('Role updated')
      await load()
    } catch {
      toast.error('Failed to update role')
    } finally {
      setUpdating(null)
    }
  }

  const roleIcon = (role: Role) => {
    if (role === 'admin') return <Shield size={14} className="text-red-500" />
    if (role === 'cashier') return <ShoppingBag size={14} className="text-amber-500" />
    return <User size={14} className="text-gray-400" />
  }

  return (
    <AdminLayout>
      <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Staff & Users</h2>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-green-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">User</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden sm:table-cell">Phone</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Current Role</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Change Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.uid} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt="" className="w-7 h-7 rounded-full" />
                      ) : (
                        <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                          <User size={14} className="text-gray-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-800">{u.name || '—'}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden sm:table-cell">{u.phone || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {roleIcon(u.role)} {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {u.uid === currentUser?.uid ? (
                      <span className="text-xs text-gray-400">(you)</span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.uid, e.target.value as Role)}
                        disabled={updating === u.uid}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:border-green-500 outline-none disabled:opacity-50"
                      >
                        <option value="customer">Customer</option>
                        <option value="cashier">Cashier</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <UserCog size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No users found</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}

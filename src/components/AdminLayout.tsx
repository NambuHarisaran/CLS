import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  ShoppingCart, LayoutDashboard, Package, Users, Tag,
  Megaphone, Settings, UserCog, LogOut, Menu, X, ChevronLeft
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/coupons', label: 'Coupons', icon: Tag },
  { to: '/admin/offers', label: 'Offers', icon: Megaphone },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/staff', label: 'Staff & Users', icon: UserCog },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userDoc, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-56 bg-gray-900 flex flex-col transition-transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:static lg:translate-x-0`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          <a href="/" className="flex items-center gap-2">
            <div className="bg-green-600 text-white w-8 h-8 rounded-lg flex items-center justify-center">
              <ShoppingCart size={16} />
            </div>
            <span className="text-white font-bold">LoyalCart</span>
          </a>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <ChevronLeft size={20} />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-700 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            {userDoc?.photoURL && (
              <img src={userDoc.photoURL} alt="Avatar" className="w-8 h-8 rounded-full" />
            )}
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">{userDoc?.name}</div>
              <div className="text-xs text-gray-400">Admin</div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-3">
          <button
            className="lg:hidden text-gray-600 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <h1 className="text-lg font-bold text-gray-800">Admin Dashboard</h1>
          <div className="ml-auto flex items-center gap-2">
            <NavLink to="/pos" className="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg font-medium hover:bg-amber-200">
              Open POS
            </NavLink>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

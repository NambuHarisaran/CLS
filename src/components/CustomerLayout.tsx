import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ShoppingCart, LayoutDashboard, Receipt, Tag, User, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/me', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/me/bills', label: 'My Bills', icon: Receipt },
  { to: '/me/coupons', label: 'Coupons', icon: Tag },
  { to: '/me/profile', label: 'Profile', icon: User },
]

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { userDoc, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="bg-green-600 text-white w-8 h-8 rounded-lg flex items-center justify-center">
              <ShoppingCart size={16} />
            </div>
            <span className="font-extrabold text-green-700">LoyalCart</span>
          </a>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">{userDoc?.name || userDoc?.email}</span>
            {userDoc?.photoURL && (
              <img src={userDoc.photoURL} alt="Avatar" className="w-8 h-8 rounded-full" />
            )}
            <button onClick={handleSignOut} className="text-gray-500 hover:text-red-500 p-1" title="Sign out">
              <LogOut size={18} />
            </button>
            <button className="sm:hidden text-gray-600" onClick={() => setMobileOpen((p) => !p)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Bottom nav (mobile) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="flex">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                  isActive ? 'text-green-700' : 'text-gray-500'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Side nav (desktop) */}
      <div className="max-w-5xl mx-auto px-4 py-6 flex gap-6">
        <aside className="hidden sm:flex flex-col w-48 flex-shrink-0">
          <nav className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-gray-50 last:border-0 ${
                    isActive ? 'text-green-700 bg-green-50' : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
          <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 mt-4 px-4">
            <LogOut size={16} /> Sign out
          </button>
        </aside>

        <main className="flex-1 min-w-0 pb-20 sm:pb-0">
          {children}
        </main>
      </div>
    </div>
  )
}

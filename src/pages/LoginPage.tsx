import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ShoppingCart, Users, Briefcase } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { user, role, loading, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const mode = params.get('mode')

  useEffect(() => {
    if (!loading && user && role) {
      if (role === 'admin') navigate('/admin', { replace: true })
      else if (role === 'cashier') navigate('/pos', { replace: true })
      else navigate('/me', { replace: true })
    }
  }, [user, role, loading, navigate])

  const handleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Sign in failed'
      if (!msg.includes('popup-closed')) toast.error('Sign in failed. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 flex flex-col items-center justify-center px-4 py-12">
      <a href="/" className="flex items-center gap-2 mb-10">
        <div className="bg-green-600 text-white w-10 h-10 rounded-xl flex items-center justify-center">
          <ShoppingCart size={22} />
        </div>
        <span className="text-2xl font-extrabold text-green-700">LoyalCart</span>
      </a>

      <div className="w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-2">Welcome back</h1>
        <p className="text-gray-500 text-center mb-8">Choose how you'd like to sign in</p>

        <div className="grid grid-cols-1 gap-4">
          {/* Customer Login Card */}
          <div className={`rounded-2xl border-2 p-6 cursor-pointer transition-all hover:shadow-md ${
            mode === 'customer' || !mode ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
          }`} onClick={handleSignIn}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users size={24} className="text-green-700" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-800 mb-1">Customer Login</h2>
                <p className="text-gray-500 text-sm">View your points, bills, and offers</p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleSignIn() }}
              className="w-full mt-4 flex items-center justify-center gap-3 bg-white border-2 border-green-200 hover:border-green-400 py-3 rounded-xl font-semibold text-gray-700 transition-all hover:bg-green-50"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
          </div>

          {/* Staff Login Card */}
          <div className={`rounded-2xl border-2 p-6 cursor-pointer transition-all hover:shadow-md ${
            mode === 'staff' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white'
          }`} onClick={handleSignIn}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Briefcase size={24} className="text-amber-700" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-800 mb-1">Shop / Staff Login</h2>
                <p className="text-gray-500 text-sm">POS billing, admin dashboard, and management</p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleSignIn() }}
              className="w-full mt-4 flex items-center justify-center gap-3 bg-white border-2 border-amber-200 hover:border-amber-400 py-3 rounded-xl font-semibold text-gray-700 transition-all hover:bg-amber-50"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}

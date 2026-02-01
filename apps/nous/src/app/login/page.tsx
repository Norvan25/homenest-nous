'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  
  // Create browser client for proper cookie handling
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log('Attempting login for:', email)
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      console.log('Login response:', { data, signInError })

      if (signInError) {
        throw signInError
      }

      if (!data.session) {
        throw new Error('No session returned')
      }

      console.log('Login successful, redirecting...')

      // Log the login (non-blocking)
      supabase.from('login_logs').insert({
        user_id: data.user?.id,
        email: email,
        event_type: 'login',
        success: true
      }).then(() => {}).catch(() => {})

      router.push('/')
      router.refresh()
    } catch (err: any) {
      console.error('Login error:', err)
      
      // Translate Supabase errors to user-friendly messages
      let errorMessage = 'Failed to sign in'
      const errorCode = err.message?.toLowerCase() || ''
      
      if (errorCode.includes('invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.'
      } else if (errorCode.includes('email not confirmed')) {
        errorMessage = 'Please verify your email address before signing in.'
      } else if (errorCode.includes('user not found') || errorCode.includes('no user')) {
        errorMessage = 'No account found with this email. Please contact your administrator.'
      } else if (errorCode.includes('too many requests')) {
        errorMessage = 'Too many login attempts. Please wait a few minutes and try again.'
      } else if (errorCode.includes('network') || errorCode.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      
      // Log failed attempt (non-blocking)
      supabase.from('login_logs').insert({
        email: email,
        event_type: 'login',
        success: false,
        failure_reason: err.message
      }).then(() => {}).catch(() => {})
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gold-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-navy-900 font-bold text-2xl">HN</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">HomeNest Nous</h1>
          <p className="text-white/50 mt-1">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-navy-800 border border-white/10 rounded-lg p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-norv hover:bg-norv/80 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-sm mt-6">
          Contact your administrator for account access
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSetupPassword, setShowSetupPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [checkingEmail, setCheckingEmail] = useState(false)

  // Check if email needs password setup when email field loses focus
  const checkEmailNeedsSetup = async () => {
    if (!email) return
    setCheckingEmail(true)
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (data.requiresPasswordSetup) {
        setShowSetupPassword(true)
      }
    } catch (err) {
      // Ignore errors, user can still try to login
    } finally {
      setCheckingEmail(false)
    }
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.requiresPasswordSetup) {
        setShowSetupPassword(true)
        setIsLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Use window.location for hard refresh to load server-side session state
      window.location.href = '/admin/orders'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setIsLoading(false)
    }
  }

  const handleSetupPassword = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: newPassword,
          confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set password')
      }

      // Use window.location for hard refresh to load server-side session state
      window.location.href = '/admin/orders'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set password')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-primary">
              BlueCilantro
            </Link>
            <p className="text-gray-600 mt-2">Admin Portal</p>
          </div>

          {!showSetupPassword ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={checkEmailNeedsSetup}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="gpwc@bluecilantro.ca"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSetupPassword} className="space-y-4">
              <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm mb-4">
                Welcome! Please set your password for the first time.
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Re-enter password"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Setting up...' : 'Set Password & Continue'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-primary">
              ← Back to Menu
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface AdminNavProps {
  email: string
}

export function AdminNav({ email }: AdminNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed')
    if (saved === 'true') {
      setIsCollapsed(true)
    }
  }, [])

  // Save collapsed state to localStorage and dispatch event
  const toggleCollapsed = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('adminSidebarCollapsed', String(newState))
    // Dispatch custom event for same-window updates
    window.dispatchEvent(new Event('sidebarToggle'))
  }

  const navItems = [
    { href: '/admin/orders', label: 'Orders', icon: '📋' },
    { href: '/admin/calendar', label: 'Calendar', icon: '📅' },
    { href: '/admin/menu', label: 'Menu', icon: '🍽️' },
    { href: '/admin/packages', label: 'Packages', icon: '📦' },
    { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ]

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    // Use window.location for hard refresh to clear server-side session state
    window.location.href = '/admin/login'
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-primary text-white p-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/admin/orders" className="text-xl font-bold">
          BlueCilantro Admin
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-primary-dark transition-colors"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-out Menu */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b bg-primary text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">BlueCilantro</h2>
              <p className="text-sm text-primary-100 opacity-80">Admin Portal</p>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-primary-dark transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                pathname.startsWith(item.href)
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-500 mb-3 truncate">{email}</div>
          <div className="flex gap-2">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex-1 text-center px-3 py-2 text-sm text-gray-600 bg-white border rounded-lg hover:bg-gray-100 transition-colors"
            >
              View Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 px-3 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r shadow-sm transition-all duration-300 z-40 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
      >
        {/* Header */}
        <div className={`border-b ${isCollapsed ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center justify-between">
            <Link
              href="/admin/orders"
              className={`font-bold text-primary transition-all ${isCollapsed ? 'text-sm' : 'text-xl'}`}
            >
              {isCollapsed ? 'BC' : 'BlueCilantro'}
            </Link>
            <button
              onClick={toggleCollapsed}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
          {!isCollapsed && <p className="text-sm text-gray-500 mt-1">Admin Portal</p>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                pathname.startsWith(item.href)
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="text-xl">{item.icon}</span>
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className={`border-t ${isCollapsed ? 'p-2' : 'p-4'}`}>
          {!isCollapsed && (
            <div className="text-sm text-gray-500 mb-2 truncate">{email}</div>
          )}
          <div className={`flex ${isCollapsed ? 'flex-col gap-2' : 'gap-2'}`}>
            <Link
              href="/"
              className={`text-center text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${
                isCollapsed ? 'p-3' : 'flex-1 px-3 py-2'
              }`}
              title={isCollapsed ? 'View Site' : undefined}
            >
              {isCollapsed ? '🌐' : 'View Site'}
            </Link>
            <button
              onClick={handleLogout}
              className={`text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
                isCollapsed ? 'p-3' : 'flex-1 px-3 py-2'
              }`}
              title={isCollapsed ? 'Logout' : undefined}
            >
              {isCollapsed ? '🚪' : 'Logout'}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

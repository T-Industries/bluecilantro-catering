'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

interface AdminNavProps {
  email: string
}

export function AdminNav({ email }: AdminNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { href: '/admin/orders', label: 'Orders', icon: '📋' },
    { href: '/admin/calendar', label: 'Calendar', icon: '📅' },
    { href: '/admin/menu', label: 'Menu', icon: '🍽️' },
    { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ]

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-primary text-white p-4 flex items-center justify-between">
        <Link href="/admin/orders" className="text-xl font-bold">
          BlueCilantro Admin
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b shadow-lg">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-lg ${
                  pathname.startsWith(item.href)
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
            <hr className="my-2" />
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              🚪 Logout
            </button>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r shadow-sm">
        <div className="p-6 border-b">
          <Link href="/admin/orders" className="text-xl font-bold text-primary">
            BlueCilantro
          </Link>
          <p className="text-sm text-gray-500 mt-1">Admin Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                pathname.startsWith(item.href)
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="text-sm text-gray-500 mb-2 truncate">{email}</div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="flex-1 text-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              View Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

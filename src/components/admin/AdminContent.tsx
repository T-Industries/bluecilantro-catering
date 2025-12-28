'use client'

import { useState, useEffect } from 'react'

interface AdminContentProps {
  children: React.ReactNode
}

export function AdminContent({ children }: AdminContentProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    // Initial load
    const saved = localStorage.getItem('adminSidebarCollapsed')
    setIsCollapsed(saved === 'true')

    // Listen for changes to localStorage (from sidebar toggle)
    const handleStorageChange = () => {
      const saved = localStorage.getItem('adminSidebarCollapsed')
      setIsCollapsed(saved === 'true')
    }

    // Custom event for same-tab updates
    window.addEventListener('storage', handleStorageChange)

    // Also listen for custom event for same-window updates
    const handleSidebarToggle = () => {
      const saved = localStorage.getItem('adminSidebarCollapsed')
      setIsCollapsed(saved === 'true')
    }
    window.addEventListener('sidebarToggle', handleSidebarToggle)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('sidebarToggle', handleSidebarToggle)
    }
  }, [])

  return (
    <main
      className={`transition-all duration-300 ${
        isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}
    >
      {children}
    </main>
  )
}

import { prisma } from '@/lib/db'
import { CartButton } from '@/components/menu/CartButton'
import Link from 'next/link'

async function getSettings() {
  const settings = await prisma.setting.findMany()
  return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>)
}

async function getPackageCount() {
  const count = await prisma.menuPackage.count({
    where: { active: true },
  })
  return count
}

export default async function HomePage() {
  const settings = await getSettings()
  const packageCount = await getPackageCount()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{settings.business_name || 'BlueCilantro'}</h1>
              <p className="text-primary-light mt-1">Catering Services</p>
            </div>
            <div className="flex items-center gap-4">
              <a href="/track" className="text-sm hover:underline">Track Order</a>
              <CartButton />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary to-primary-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Delicious Catering for Every Occasion</h2>
          <p className="text-xl text-gray-200 mb-8">
            From intimate gatherings to large events, we bring authentic flavors to your table.
          </p>
        </div>
      </section>

      {/* Menu Type Selection */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">How would you like to order?</h2>
        <p className="text-center text-gray-600 mb-12">
          Choose from our individual items or select a catering package for your event.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* A La Carte Option */}
          <Link
            href="/menu/standard"
            className="group block bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border-2 border-transparent hover:border-primary"
          >
            <div className="h-48 bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
              <span className="text-6xl">🍽️</span>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                A La Carte Menu
              </h3>
              <p className="text-gray-600 mb-4">
                Order individual items from our full menu. Perfect for smaller gatherings or custom selections.
              </p>
              <div className="flex items-center text-primary font-medium">
                Browse Menu
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Packages Option */}
          <Link
            href="/menu/packages"
            className={`group block bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border-2 border-transparent hover:border-primary ${
              packageCount === 0 ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center relative">
              <span className="text-6xl">📦</span>
              {packageCount > 0 && (
                <span className="absolute top-4 right-4 bg-accent text-white text-sm px-3 py-1 rounded-full font-medium">
                  {packageCount} Package{packageCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                Catering Packages
              </h3>
              <p className="text-gray-600 mb-4">
                {packageCount > 0
                  ? 'Pre-designed packages with tier-based pricing. Great for larger events with per-person pricing.'
                  : 'Packages coming soon! Check back later for our catering package options.'}
              </p>
              {packageCount > 0 && (
                <div className="flex items-center text-primary font-medium">
                  View Packages
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          </Link>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          * You can add items from both menus to your cart
        </p>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-lg font-semibold">{settings.business_name || 'BlueCilantro'}</p>
          {settings.business_phone && <p className="mt-2">{settings.business_phone}</p>}
          {settings.business_address && <p className="mt-1 text-gray-400">{settings.business_address}</p>}
          <div className="mt-4">
            <a href="/track" className="text-primary-light hover:underline text-sm">Track Your Order</a>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            &copy; {new Date().getFullYear()} {settings.business_name || 'BlueCilantro'}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

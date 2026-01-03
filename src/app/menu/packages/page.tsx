import { prisma } from '@/lib/db'
import { CartButton } from '@/components/menu/CartButton'
import Link from 'next/link'

async function getPackages() {
  const packages = await prisma.menuPackage.findMany({
    where: { active: true },
    orderBy: { displayOrder: 'asc' },
    include: {
      tiers: {
        where: { active: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
  })
  return packages
}

async function getSettings() {
  const settings = await prisma.setting.findMany()
  return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>)
}

export default async function PackagesMenuPage() {
  const packages = await getPackages()
  const settings = await getSettings()

  const packageTypeLabels = {
    selection: 'Selection Package',
    quantity: 'Quantity Based',
    fixed: 'Fixed Price',
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-3xl font-bold hover:opacity-90">
                {settings.business_name || 'BlueCilantro'}
              </Link>
              <p className="text-primary-light mt-1">Catering Services</p>
            </div>
            <div className="flex items-center gap-4">
              <a href="/track" className="text-sm hover:underline">Track Order</a>
              <CartButton />
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-gray-100 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-primary hover:underline">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">Catering Packages</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Catering Packages</h2>
            <p className="text-gray-600 mt-2">
              Choose a package that suits your event. Pricing is per person unless otherwise noted.
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Change Menu Type
          </Link>
        </div>

        {packages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No packages available at the moment. Please check back soon!
            </p>
            <Link href="/menu/standard" className="text-primary hover:underline mt-4 inline-block">
              Browse our A La Carte menu instead
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => {
              const lowestPrice = pkg.tiers.length > 0
                ? Math.min(...pkg.tiers.map(t => parseFloat(t.price.toString())))
                : null

              return (
                <Link
                  key={pkg.id}
                  href={`/menu/packages/${pkg.id}`}
                  className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all border-2 border-transparent hover:border-primary"
                >
                  {/* Image or Gradient */}
                  {pkg.imageUrl ? (
                    <img
                      src={pkg.imageUrl}
                      alt={pkg.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className={`h-48 flex items-center justify-center ${
                      pkg.type === 'selection' ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
                      pkg.type === 'quantity' ? 'bg-gradient-to-br from-green-500 to-green-700' :
                      'bg-gradient-to-br from-purple-500 to-purple-700'
                    }`}>
                      <span className="text-5xl">
                        {pkg.type === 'selection' ? '🍽️' :
                         pkg.type === 'quantity' ? '🥡' : '🎁'}
                      </span>
                    </div>
                  )}

                  {/* Badge */}
                  {pkg.badge && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-accent text-white text-sm px-3 py-1 rounded-full font-medium shadow">
                        {pkg.badge}
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6 relative">
                    {/* Badge positioned here if image exists */}
                    {pkg.badge && pkg.imageUrl && (
                      <span className="absolute -top-8 right-4 bg-accent text-white text-sm px-3 py-1 rounded-full font-medium shadow">
                        {pkg.badge}
                      </span>
                    )}

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {pkg.name}
                      </h3>
                    </div>

                    <span className={`inline-block text-xs px-2 py-1 rounded mb-3 ${
                      pkg.type === 'selection' ? 'bg-blue-100 text-blue-700' :
                      pkg.type === 'quantity' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {packageTypeLabels[pkg.type as keyof typeof packageTypeLabels]}
                    </span>

                    {pkg.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{pkg.description}</p>
                    )}

                    {/* Pricing info */}
                    {lowestPrice !== null && (
                      <div className="mb-4">
                        <span className="text-2xl font-bold text-primary">
                          ${lowestPrice.toFixed(0)}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {pkg.type === 'selection' ? ' /person' : ''}
                          {pkg.tiers.length > 1 && ' starting'}
                        </span>
                      </div>
                    )}

                    {/* Min guests for selection type */}
                    {pkg.type === 'selection' && pkg.minGuests && (
                      <p className="text-sm text-gray-500 mb-3">
                        Minimum {pkg.minGuests} guests
                      </p>
                    )}

                    {/* Tier preview for selection packages */}
                    {pkg.type === 'selection' && pkg.tiers.length > 0 && (
                      <div className="text-xs text-gray-500 mb-3">
                        {pkg.tiers.slice(0, 3).map((tier, i) => (
                          <span key={tier.id}>
                            {i > 0 && ' • '}
                            {tier.name} ${parseFloat(tier.price.toString()).toFixed(0)}
                          </span>
                        ))}
                        {pkg.tiers.length > 3 && ' ...'}
                      </div>
                    )}

                    <div className="flex items-center text-primary font-medium pt-3 border-t">
                      Configure Package
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-12">
          * Prices do not include taxes. Final amount will be confirmed upon order.
        </p>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
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

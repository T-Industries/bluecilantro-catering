import { prisma } from '@/lib/db'
import { MenuItemCard } from '@/components/menu/MenuItemCard'
import { CartButton } from '@/components/menu/CartButton'
import Link from 'next/link'

async function getMenuData() {
  const categories = await prisma.menuCategory.findMany({
    where: { active: true },
    orderBy: { displayOrder: 'asc' },
    include: {
      items: {
        where: { active: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
  })
  return categories
}

async function getSettings() {
  const settings = await prisma.setting.findMany()
  return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>)
}

export default async function StandardMenuPage() {
  const categories = await getMenuData()
  const settings = await getSettings()

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
            <span className="text-gray-600">A La Carte Menu</span>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">A La Carte Menu</h2>
            <p className="text-gray-600 mt-2">
              * Prices do not include taxes. Final amount will be confirmed upon order.
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

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Menu is being prepared. Please check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {categories.map((category) => (
              <section key={category.id}>
                <h3 className="text-2xl font-bold text-primary mb-6 pb-2 border-b-2 border-primary">
                  {category.name}
                </h3>
                {category.items.length === 0 ? (
                  <p className="text-gray-500">No items available in this category.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.items.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={{
                          id: item.id,
                          name: item.name,
                          description: item.description,
                          price: parseFloat(item.price.toString()),
                          pricingType: item.pricingType,
                          servesCount: item.servesCount,
                          imageUrl: item.imageUrl,
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
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

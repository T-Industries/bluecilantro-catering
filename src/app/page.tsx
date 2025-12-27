import { prisma } from '@/lib/db'
import { MenuItemCard } from '@/components/menu/MenuItemCard'
import { CartButton } from '@/components/menu/CartButton'

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

export default async function HomePage() {
  const categories = await getMenuData()
  const settings = await getSettings()

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
          <a
            href="#menu"
            className="inline-block bg-accent text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
          >
            View Our Menu
          </a>
        </div>
      </section>

      {/* Menu Section */}
      <main id="menu" className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Our Menu</h2>
        <p className="text-center text-gray-600 mb-12">
          * Prices do not include taxes. Final amount will be confirmed upon order.
        </p>

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

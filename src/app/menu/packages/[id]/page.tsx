'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCartContext } from '@/components/CartProvider'

interface PackageTier {
  id: string
  name: string
  description: string | null
  selectCount: number | null
  price: string
}

interface PackageCategoryItem {
  id: string
  name: string
  description: string | null
}

interface PackageCategory {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  items: PackageCategoryItem[]
}

interface PackageItem {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  price: string | null
  tierPrices: Record<string, string> | null
  badge: string | null
}

interface PackageUpgrade {
  id: string
  name: string
  description: string | null
  pricePerPerson: string
}

interface MenuPackage {
  id: string
  name: string
  description: string | null
  type: 'selection' | 'quantity' | 'fixed'
  imageUrl: string | null
  badge: string | null
  minGuests: number | null
  tiers: PackageTier[]
  categories: PackageCategory[]
  items: PackageItem[]
  upgrades: PackageUpgrade[]
}

export default function PackageConfiguratorPage() {
  const params = useParams()
  const router = useRouter()
  const packageId = params.id as string
  const { addPackageToCart } = useCartContext()

  const [pkg, setPkg] = useState<MenuPackage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selection package state
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null)
  const [guestCount, setGuestCount] = useState<number>(10)
  const [categorySelections, setCategorySelections] = useState<Record<string, string[]>>({})
  const [selectedUpgrades, setSelectedUpgrades] = useState<string[]>([])

  // Quantity/Fixed package state (per-item quantities)
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({})
  const [itemTierSelections, setItemTierSelections] = useState<Record<string, string>>({})

  const [showAddedToast, setShowAddedToast] = useState(false)

  useEffect(() => {
    fetchPackage()
  }, [packageId])

  const fetchPackage = async () => {
    try {
      const response = await fetch(`/api/packages/${packageId}`)
      if (!response.ok) throw new Error('Package not found')
      const data = await response.json()
      setPkg(data)

      // Initialize state based on package type
      if (data.type === 'selection' && data.tiers.length > 0) {
        setSelectedTierId(data.tiers[0].id)
      }
      if (data.minGuests) {
        setGuestCount(data.minGuests)
      }

      // Initialize category selections
      const initialSelections: Record<string, string[]> = {}
      data.categories?.forEach((cat: PackageCategory) => {
        initialSelections[cat.id] = []
      })
      setCategorySelections(initialSelections)

      // Initialize item tier selections for quantity packages
      if (data.type === 'quantity' && data.tiers.length > 0) {
        const initialTiers: Record<string, string> = {}
        data.items?.forEach((item: PackageItem) => {
          initialTiers[item.id] = data.tiers[0].id
        })
        setItemTierSelections(initialTiers)
      }
    } catch (err) {
      setError('Failed to load package')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedTier = pkg?.tiers.find(t => t.id === selectedTierId)

  // Calculate total for selection package
  const calculateSelectionTotal = () => {
    if (!pkg || pkg.type !== 'selection' || !selectedTier) return 0
    const tierTotal = parseFloat(selectedTier.price) * guestCount
    const upgradesTotal = selectedUpgrades.reduce((sum, upgradeId) => {
      const upgrade = pkg.upgrades.find(u => u.id === upgradeId)
      return sum + (upgrade ? parseFloat(upgrade.pricePerPerson) * guestCount : 0)
    }, 0)
    return tierTotal + upgradesTotal
  }

  // Calculate total for quantity/fixed items
  const calculateItemsTotal = () => {
    if (!pkg) return 0
    return Object.entries(itemQuantities).reduce((sum, [itemId, qty]) => {
      if (qty <= 0) return sum
      const item = pkg.items.find(i => i.id === itemId)
      if (!item) return sum

      if (pkg.type === 'fixed') {
        return sum + (parseFloat(item.price || '0') * qty)
      } else if (pkg.type === 'quantity') {
        const tierId = itemTierSelections[itemId]
        const price = item.tierPrices?.[tierId] || item.price || '0'
        return sum + (parseFloat(price) * qty)
      }
      return sum
    }, 0)
  }

  // Handle category item selection
  const toggleCategoryItem = (categoryId: string, itemId: string) => {
    const maxSelections = selectedTier?.selectCount || 1
    const current = categorySelections[categoryId] || []

    if (current.includes(itemId)) {
      // Remove selection
      setCategorySelections({
        ...categorySelections,
        [categoryId]: current.filter(id => id !== itemId),
      })
    } else if (current.length < maxSelections) {
      // Add selection (allow duplicates up to maxSelections)
      setCategorySelections({
        ...categorySelections,
        [categoryId]: [...current, itemId],
      })
    }
  }

  // Toggle upgrade selection
  const toggleUpgrade = (upgradeId: string) => {
    if (selectedUpgrades.includes(upgradeId)) {
      setSelectedUpgrades(selectedUpgrades.filter(id => id !== upgradeId))
    } else {
      setSelectedUpgrades([...selectedUpgrades, upgradeId])
    }
  }

  // Update item quantity
  const updateItemQuantity = (itemId: string, delta: number) => {
    const current = itemQuantities[itemId] || 0
    const newQty = Math.max(0, current + delta)
    setItemQuantities({ ...itemQuantities, [itemId]: newQty })
  }

  // Check if selection package is complete
  const isSelectionComplete = () => {
    if (!pkg || pkg.type !== 'selection' || !selectedTier) return false
    const requiredCount = selectedTier.selectCount || 1

    for (const category of pkg.categories) {
      const selections = categorySelections[category.id] || []
      if (selections.length < requiredCount) return false
    }
    return true
  }

  // Add selection package to cart
  const handleAddSelectionToCart = () => {
    if (!pkg || !selectedTier || !isSelectionComplete()) return

    const selections = Object.entries(categorySelections).map(([categoryId, itemIds]) => {
      const category = pkg.categories.find(c => c.id === categoryId)
      return {
        categoryId,
        categoryName: category?.name || '',
        items: itemIds.map(itemId => {
          const item = category?.items.find(i => i.id === itemId)
          return { id: itemId, name: item?.name || '' }
        }),
      }
    })

    const upgrades = selectedUpgrades.map(upgradeId => {
      const upgrade = pkg.upgrades.find(u => u.id === upgradeId)
      return {
        id: upgradeId,
        name: upgrade?.name || '',
        pricePerPerson: parseFloat(upgrade?.pricePerPerson || '0'),
      }
    })

    addPackageToCart({
      packageId: pkg.id,
      packageName: pkg.name,
      packageType: 'selection',
      tierId: selectedTier.id,
      tierName: selectedTier.name,
      tierPrice: parseFloat(selectedTier.price),
      guestCount,
      selections,
      upgrades,
      total: calculateSelectionTotal(),
    })

    setShowAddedToast(true)
    setTimeout(() => {
      setShowAddedToast(false)
      router.push('/menu/packages')
    }, 1500)
  }

  // Add quantity/fixed item to cart
  const handleAddItemToCart = (item: PackageItem) => {
    if (!pkg) return
    const qty = itemQuantities[item.id] || 0
    if (qty <= 0) return

    let price = 0
    let tierName = ''

    if (pkg.type === 'fixed') {
      price = parseFloat(item.price || '0')
    } else if (pkg.type === 'quantity') {
      const tierId = itemTierSelections[item.id]
      const tier = pkg.tiers.find(t => t.id === tierId)
      tierName = tier?.name || ''
      price = parseFloat(item.tierPrices?.[tierId] || item.price || '0')
    }

    addPackageToCart({
      packageId: pkg.id,
      packageName: pkg.name,
      packageType: pkg.type,
      itemId: item.id,
      itemName: item.name,
      tierId: pkg.type === 'quantity' ? itemTierSelections[item.id] : undefined,
      tierName: pkg.type === 'quantity' ? tierName : undefined,
      quantity: qty,
      unitPrice: price,
      total: price * qty,
    })

    // Reset quantity for this item
    setItemQuantities({ ...itemQuantities, [item.id]: 0 })

    setShowAddedToast(true)
    setTimeout(() => setShowAddedToast(false), 1500)
  }

  if (isLoading) {
    return <div className="p-8 text-center">Loading package...</div>
  }

  if (error || !pkg) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error || 'Package not found'}</p>
        <Link href="/menu/packages" className="text-primary hover:underline">
          Back to Packages
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-3xl font-bold hover:opacity-90">
              BlueCilantro
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/cart" className="text-sm hover:underline">View Cart</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-primary hover:underline">Home</Link>
            <span className="text-gray-400">/</span>
            <Link href="/menu/packages" className="text-primary hover:underline">Packages</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">{pkg.name}</span>
          </div>
        </div>
      </div>

      {/* Toast */}
      {showAddedToast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
          Added to cart!
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Package Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{pkg.name}</h1>
              {pkg.badge && (
                <span className="inline-block bg-accent text-white text-sm px-3 py-1 rounded-full mt-2">
                  {pkg.badge}
                </span>
              )}
              {pkg.description && (
                <p className="text-gray-600 mt-3">{pkg.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Selection Package UI */}
        {pkg.type === 'selection' && (
          <>
            {/* Step 1: Select Tier */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Step 1: Choose Your Package Tier</h2>
              <div className="grid gap-3">
                {pkg.tiers.map((tier) => (
                  <label
                    key={tier.id}
                    className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedTierId === tier.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="tier"
                        value={tier.id}
                        checked={selectedTierId === tier.id}
                        onChange={() => setSelectedTierId(tier.id)}
                        className="w-5 h-5 text-primary"
                      />
                      <div>
                        <div className="font-medium">{tier.name}</div>
                        {tier.description && (
                          <div className="text-sm text-gray-500">{tier.description}</div>
                        )}
                        {tier.selectCount && (
                          <div className="text-xs text-gray-400">
                            Select {tier.selectCount} item{tier.selectCount > 1 ? 's' : ''} per category
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xl font-bold text-primary">
                      ${parseFloat(tier.price).toFixed(2)}
                      <span className="text-sm font-normal text-gray-500">/person</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 2: Make Selections */}
            {selectedTier && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">
                  Step 2: Make Your Selections
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (Choose {selectedTier.selectCount || 1} per category)
                  </span>
                </h2>

                <div className="space-y-6">
                  {pkg.categories.map((category) => {
                    const selections = categorySelections[category.id] || []
                    const maxSelections = selectedTier.selectCount || 1
                    const isComplete = selections.length >= maxSelections

                    return (
                      <div key={category.id} className="border-b pb-6 last:border-b-0">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg">{category.name}</h3>
                          <span className={`text-sm px-2 py-1 rounded ${
                            isComplete ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {selections.length}/{maxSelections} selected
                          </span>
                        </div>
                        {category.description && (
                          <p className="text-sm text-gray-500 mb-3">{category.description}</p>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {category.items.map((item) => {
                            const selectionCount = selections.filter(id => id === item.id).length
                            const canSelect = selections.length < maxSelections

                            return (
                              <button
                                key={`${item.id}-${selectionCount}`}
                                onClick={() => toggleCategoryItem(category.id, item.id)}
                                className={`p-3 text-left border-2 rounded-lg transition-colors ${
                                  selectionCount > 0
                                    ? 'border-primary bg-primary/5'
                                    : canSelect
                                    ? 'border-gray-200 hover:border-gray-300'
                                    : 'border-gray-100 opacity-50'
                                }`}
                              >
                                <div className="font-medium text-sm">{item.name}</div>
                                {item.description && (
                                  <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                                )}
                                {selectionCount > 1 && (
                                  <div className="text-xs text-primary mt-1">x{selectionCount}</div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Guest Count */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Step 3: Number of Guests</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setGuestCount(Math.max(pkg.minGuests || 1, guestCount - 1))}
                  className="w-12 h-12 rounded-lg border-2 border-gray-200 hover:border-gray-300 text-xl font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Math.max(pkg.minGuests || 1, parseInt(e.target.value) || 1))}
                  className="w-24 text-center text-2xl font-bold border-2 rounded-lg py-2"
                  min={pkg.minGuests || 1}
                />
                <button
                  onClick={() => setGuestCount(guestCount + 1)}
                  className="w-12 h-12 rounded-lg border-2 border-gray-200 hover:border-gray-300 text-xl font-bold"
                >
                  +
                </button>
                <span className="text-gray-500">guests</span>
              </div>
              {pkg.minGuests && (
                <p className="text-sm text-gray-500 mt-2">Minimum {pkg.minGuests} guests required</p>
              )}
            </div>

            {/* Step 4: Upgrades (Optional) */}
            {pkg.upgrades.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">
                  Step 4: Premium Upgrades
                  <span className="text-sm font-normal text-gray-500 ml-2">(Optional)</span>
                </h2>
                <div className="space-y-3">
                  {pkg.upgrades.map((upgrade) => (
                    <label
                      key={upgrade.id}
                      className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedUpgrades.includes(upgrade.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedUpgrades.includes(upgrade.id)}
                          onChange={() => toggleUpgrade(upgrade.id)}
                          className="w-5 h-5 text-primary rounded"
                        />
                        <div>
                          <div className="font-medium">{upgrade.name}</div>
                          {upgrade.description && (
                            <div className="text-sm text-gray-500">{upgrade.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        +${parseFloat(upgrade.pricePerPerson).toFixed(2)}
                        <span className="text-sm font-normal text-gray-500">/person</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Summary & Add to Cart */}
            <div className="bg-white rounded-xl shadow-lg p-6 sticky bottom-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-gray-500">Total for {guestCount} guests</div>
                  <div className="text-3xl font-bold text-primary">
                    ${calculateSelectionTotal().toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={handleAddSelectionToCart}
                  disabled={!isSelectionComplete()}
                  className={`px-8 py-4 rounded-lg font-bold text-lg transition-colors ${
                    isSelectionComplete()
                      ? 'bg-primary text-white hover:bg-primary-dark'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Add to Cart
                </button>
              </div>
              {!isSelectionComplete() && (
                <p className="text-sm text-amber-600">
                  Please complete all selections before adding to cart
                </p>
              )}
            </div>
          </>
        )}

        {/* Quantity Package UI */}
        {pkg.type === 'quantity' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-6">Select Items</h2>
            <div className="space-y-4">
              {pkg.items.map((item) => {
                const qty = itemQuantities[item.id] || 0
                const selectedTierId = itemTierSelections[item.id]
                const price = item.tierPrices?.[selectedTierId] || item.price || '0'

                return (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="w-20 h-20 rounded object-cover" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            {item.badge && (
                              <span className="inline-block bg-accent text-white text-xs px-2 py-0.5 rounded-full mt-1">
                                {item.badge}
                              </span>
                            )}
                            {item.description && (
                              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                            )}
                          </div>
                        </div>

                        {/* Tier Selection */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {pkg.tiers.map((tier) => {
                            const tierPrice = item.tierPrices?.[tier.id] || tier.price
                            return (
                              <button
                                key={tier.id}
                                onClick={() => setItemTierSelections({
                                  ...itemTierSelections,
                                  [item.id]: tier.id
                                })}
                                className={`px-3 py-2 text-sm border-2 rounded-lg transition-colors ${
                                  selectedTierId === tier.id
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <span className="font-medium">{tier.name}</span>
                                <span className="ml-2 text-primary font-bold">
                                  ${parseFloat(tierPrice).toFixed(2)}
                                </span>
                              </button>
                            )
                          })}
                        </div>

                        {/* Quantity & Add */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex items-center border rounded-lg">
                            <button
                              onClick={() => updateItemQuantity(item.id, -1)}
                              className="px-3 py-2 hover:bg-gray-100"
                            >
                              -
                            </button>
                            <span className="px-4 py-2 font-bold">{qty}</span>
                            <button
                              onClick={() => updateItemQuantity(item.id, 1)}
                              className="px-3 py-2 hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                          {qty > 0 && (
                            <>
                              <span className="text-gray-500">
                                = ${(parseFloat(price) * qty).toFixed(2)}
                              </span>
                              <button
                                onClick={() => handleAddItemToCart(item)}
                                className="ml-auto bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
                              >
                                Add to Cart
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Fixed Package UI */}
        {pkg.type === 'fixed' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-6">Select Items</h2>
            <div className="space-y-4">
              {pkg.items.map((item) => {
                const qty = itemQuantities[item.id] || 0
                const price = parseFloat(item.price || '0')

                return (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="w-20 h-20 rounded object-cover" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            {item.badge && (
                              <span className="inline-block bg-accent text-white text-xs px-2 py-0.5 rounded-full mt-1">
                                {item.badge}
                              </span>
                            )}
                            {item.description && (
                              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                            )}
                          </div>
                          <div className="text-xl font-bold text-primary">
                            ${price.toFixed(2)}
                          </div>
                        </div>

                        {/* Quantity & Add */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex items-center border rounded-lg">
                            <button
                              onClick={() => updateItemQuantity(item.id, -1)}
                              className="px-3 py-2 hover:bg-gray-100"
                            >
                              -
                            </button>
                            <span className="px-4 py-2 font-bold">{qty}</span>
                            <button
                              onClick={() => updateItemQuantity(item.id, 1)}
                              className="px-3 py-2 hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                          {qty > 0 && (
                            <>
                              <span className="text-gray-500">
                                = ${(price * qty).toFixed(2)}
                              </span>
                              <button
                                onClick={() => handleAddItemToCart(item)}
                                className="ml-auto bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
                              >
                                Add to Cart
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link href="/menu/packages" className="text-primary hover:underline">
            &larr; Back to Packages
          </Link>
        </div>
      </main>
    </div>
  )
}

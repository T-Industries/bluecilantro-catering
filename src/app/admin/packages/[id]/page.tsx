'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface PackageTier {
  id: string
  name: string
  description: string | null
  selectCount: number | null
  price: string
  active: boolean
  displayOrder: number
}

interface PackageCategoryItem {
  id: string
  name: string
  description: string | null
  active: boolean
  displayOrder: number
}

interface PackageCategory {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  active: boolean
  displayOrder: number
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
  active: boolean
  displayOrder: number
}

interface PackageUpgrade {
  id: string
  name: string
  description: string | null
  pricePerPerson: string
  active: boolean
  displayOrder: number
}

interface MenuPackage {
  id: string
  name: string
  description: string | null
  type: 'selection' | 'quantity' | 'fixed'
  imageUrl: string | null
  badge: string | null
  minGuests: number | null
  active: boolean
  displayOrder: number
  tiers: PackageTier[]
  categories: PackageCategory[]
  items: PackageItem[]
  upgrades: PackageUpgrade[]
}

export default function PackageEditorPage() {
  const router = useRouter()
  const params = useParams()
  const packageId = params.id as string

  const [pkg, setPkg] = useState<MenuPackage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit package details state
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [editDetails, setEditDetails] = useState({
    name: '',
    description: '',
    badge: '',
    minGuests: '',
    imageUrl: '',
  })

  // Add tier modal
  const [showAddTier, setShowAddTier] = useState(false)
  const [newTier, setNewTier] = useState({
    name: '',
    description: '',
    selectCount: '',
    price: '',
  })

  // Add category modal (for selection type)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    imageUrl: '',
  })

  // Add category item modal
  const [showAddCategoryItem, setShowAddCategoryItem] = useState<string | null>(null)
  const [newCategoryItem, setNewCategoryItem] = useState({
    name: '',
    description: '',
  })

  // Add package item modal (for quantity/fixed types)
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    imageUrl: '',
    price: '',
    badge: '',
    tierPrices: {} as Record<string, string>,
  })

  // Add upgrade modal (for selection type)
  const [showAddUpgrade, setShowAddUpgrade] = useState(false)
  const [newUpgrade, setNewUpgrade] = useState({
    name: '',
    description: '',
    pricePerPerson: '',
  })

  useEffect(() => {
    fetchPackage()
  }, [packageId])

  const fetchPackage = async () => {
    try {
      const response = await fetch(`/api/packages/${packageId}`)
      if (!response.ok) {
        throw new Error('Package not found')
      }
      const data = await response.json()
      setPkg(data)
      setEditDetails({
        name: data.name,
        description: data.description || '',
        badge: data.badge || '',
        minGuests: data.minGuests?.toString() || '',
        imageUrl: data.imageUrl || '',
      })
    } catch (err) {
      setError('Failed to load package')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const updatePackageDetails = async () => {
    try {
      await fetch(`/api/packages/${packageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editDetails.name,
          description: editDetails.description || null,
          badge: editDetails.badge || null,
          minGuests: editDetails.minGuests ? parseInt(editDetails.minGuests) : null,
          imageUrl: editDetails.imageUrl || null,
        }),
      })
      setIsEditingDetails(false)
      fetchPackage()
    } catch (err) {
      console.error('Failed to update package:', err)
    }
  }

  // Tier operations
  const addTier = async () => {
    if (!newTier.name || !newTier.price) return
    try {
      await fetch(`/api/packages/${packageId}/tiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTier.name,
          description: newTier.description || null,
          selectCount: newTier.selectCount ? parseInt(newTier.selectCount) : null,
          price: parseFloat(newTier.price),
        }),
      })
      setNewTier({ name: '', description: '', selectCount: '', price: '' })
      setShowAddTier(false)
      fetchPackage()
    } catch (err) {
      console.error('Failed to add tier:', err)
    }
  }

  const deleteTier = async (tierId: string) => {
    if (!confirm('Delete this tier?')) return
    try {
      await fetch(`/api/packages/${packageId}/tiers/${tierId}`, { method: 'DELETE' })
      fetchPackage()
    } catch (err) {
      console.error('Failed to delete tier:', err)
    }
  }

  // Category operations (selection type)
  const addCategory = async () => {
    if (!newCategory.name) return
    try {
      await fetch(`/api/packages/${packageId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategory.name,
          description: newCategory.description || null,
          imageUrl: newCategory.imageUrl || null,
        }),
      })
      setNewCategory({ name: '', description: '', imageUrl: '' })
      setShowAddCategory(false)
      fetchPackage()
    } catch (err) {
      console.error('Failed to add category:', err)
    }
  }

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Delete this category and all its items?')) return
    try {
      await fetch(`/api/packages/${packageId}/categories/${categoryId}`, { method: 'DELETE' })
      fetchPackage()
    } catch (err) {
      console.error('Failed to delete category:', err)
    }
  }

  // Category item operations
  const addCategoryItem = async (categoryId: string) => {
    if (!newCategoryItem.name) return
    try {
      await fetch(`/api/packages/${packageId}/categories/${categoryId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryItem.name,
          description: newCategoryItem.description || null,
        }),
      })
      setNewCategoryItem({ name: '', description: '' })
      setShowAddCategoryItem(null)
      fetchPackage()
    } catch (err) {
      console.error('Failed to add category item:', err)
    }
  }

  const deleteCategoryItem = async (categoryId: string, itemId: string) => {
    if (!confirm('Delete this item?')) return
    try {
      await fetch(`/api/packages/${packageId}/categories/${categoryId}/items/${itemId}`, { method: 'DELETE' })
      fetchPackage()
    } catch (err) {
      console.error('Failed to delete category item:', err)
    }
  }

  // Package item operations (quantity/fixed types)
  const addItem = async () => {
    if (!newItem.name) return
    try {
      const itemData: Record<string, unknown> = {
        name: newItem.name,
        description: newItem.description || null,
        imageUrl: newItem.imageUrl || null,
        badge: newItem.badge || null,
      }

      if (pkg?.type === 'fixed') {
        itemData.price = newItem.price ? parseFloat(newItem.price) : null
      } else if (pkg?.type === 'quantity') {
        // Convert tierPrices values to numbers
        const tierPrices: Record<string, number> = {}
        Object.entries(newItem.tierPrices).forEach(([tierId, price]) => {
          if (price) {
            tierPrices[tierId] = parseFloat(price)
          }
        })
        itemData.tierPrices = Object.keys(tierPrices).length > 0 ? tierPrices : null
      }

      await fetch(`/api/packages/${packageId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      })
      setNewItem({ name: '', description: '', imageUrl: '', price: '', badge: '', tierPrices: {} })
      setShowAddItem(false)
      fetchPackage()
    } catch (err) {
      console.error('Failed to add item:', err)
    }
  }

  const deleteItem = async (itemId: string) => {
    if (!confirm('Delete this item?')) return
    try {
      await fetch(`/api/packages/${packageId}/items/${itemId}`, { method: 'DELETE' })
      fetchPackage()
    } catch (err) {
      console.error('Failed to delete item:', err)
    }
  }

  // Upgrade operations (selection type)
  const addUpgrade = async () => {
    if (!newUpgrade.name || !newUpgrade.pricePerPerson) return
    try {
      await fetch(`/api/packages/${packageId}/upgrades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUpgrade.name,
          description: newUpgrade.description || null,
          price: parseFloat(newUpgrade.pricePerPerson),
        }),
      })
      setNewUpgrade({ name: '', description: '', pricePerPerson: '' })
      setShowAddUpgrade(false)
      fetchPackage()
    } catch (err) {
      console.error('Failed to add upgrade:', err)
    }
  }

  const deleteUpgrade = async (upgradeId: string) => {
    if (!confirm('Delete this upgrade?')) return
    try {
      await fetch(`/api/packages/${packageId}/upgrades/${upgradeId}`, { method: 'DELETE' })
      fetchPackage()
    } catch (err) {
      console.error('Failed to delete upgrade:', err)
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center">Loading package...</div>
  }

  if (error || !pkg) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error || 'Package not found'}</p>
        <Link href="/admin/packages" className="text-primary hover:underline">
          Back to Packages
        </Link>
      </div>
    )
  }

  const typeLabel = {
    selection: 'Selection Package',
    quantity: 'Quantity Package',
    fixed: 'Fixed Price Package',
  }[pkg.type]

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/packages" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block">
          &larr; Back to Packages
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{pkg.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded ${
                pkg.type === 'selection' ? 'bg-blue-100 text-blue-700' :
                pkg.type === 'quantity' ? 'bg-green-100 text-green-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {typeLabel}
              </span>
              {pkg.badge && (
                <span className="bg-accent text-white text-xs px-2 py-1 rounded-full">
                  {pkg.badge}
                </span>
              )}
              {!pkg.active && (
                <span className="text-xs bg-gray-200 px-2 py-1 rounded">Hidden</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsEditingDetails(true)}
            className="text-sm text-primary hover:underline"
          >
            Edit Details
          </button>
        </div>
      </div>

      {/* Edit Details Modal */}
      {isEditingDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h2 className="text-lg font-semibold mb-4">Edit Package Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editDetails.name}
                  onChange={(e) => setEditDetails({ ...editDetails, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editDetails.description}
                  onChange={(e) => setEditDetails({ ...editDetails, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Badge</label>
                  <input
                    type="text"
                    value={editDetails.badge}
                    onChange={(e) => setEditDetails({ ...editDetails, badge: e.target.value })}
                    placeholder="e.g., MOST POPULAR"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                {pkg.type === 'selection' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Guests</label>
                    <input
                      type="number"
                      value={editDetails.minGuests}
                      onChange={(e) => setEditDetails({ ...editDetails, minGuests: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={editDetails.imageUrl}
                  onChange={(e) => setEditDetails({ ...editDetails, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setIsEditingDetails(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={updatePackageDetails}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tiers Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {pkg.type === 'selection' ? 'Pricing Tiers' : 'Quantity Tiers'}
            </h2>
            <p className="text-sm text-gray-500">
              {pkg.type === 'selection'
                ? 'Define tier pricing (e.g., Choose of One $29, Choose of Two $45)'
                : 'Define quantity tiers (e.g., Half Dozen, Full Dozen)'}
            </p>
          </div>
          <button
            onClick={() => setShowAddTier(true)}
            className="text-sm text-primary hover:underline"
          >
            + Add Tier
          </button>
        </div>

        {/* Add Tier Modal */}
        {showAddTier && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-4">Add Tier</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tier Name *</label>
                  <input
                    type="text"
                    value={newTier.name}
                    onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
                    placeholder={pkg.type === 'selection' ? 'e.g., Choose of One' : 'e.g., Half Dozen'}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newTier.description}
                    onChange={(e) => setNewTier({ ...newTier, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                {pkg.type === 'selection' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Items per Category</label>
                    <input
                      type="number"
                      value={newTier.selectCount}
                      onChange={(e) => setNewTier({ ...newTier, selectCount: e.target.value })}
                      placeholder="e.g., 1 or 2"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {pkg.type === 'selection' ? 'Price per Person *' : 'Default Price *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTier.price}
                    onChange={(e) => setNewTier({ ...newTier, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button
                  onClick={() => setShowAddTier(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={addTier}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                >
                  Add Tier
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tiers List */}
        <div className="divide-y">
          {pkg.tiers.length === 0 ? (
            <div className="p-4 text-gray-500 text-sm">No tiers yet. Add your first tier.</div>
          ) : (
            pkg.tiers.map((tier) => (
              <div key={tier.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{tier.name}</div>
                  {tier.description && <div className="text-sm text-gray-500">{tier.description}</div>}
                  {pkg.type === 'selection' && tier.selectCount && (
                    <div className="text-xs text-gray-400">Select {tier.selectCount} per category</div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-primary font-semibold">
                    ${parseFloat(tier.price).toFixed(2)}
                    {pkg.type === 'selection' && <span className="text-sm font-normal">/person</span>}
                  </div>
                  <button
                    onClick={() => deleteTier(tier.id)}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Categories Section (Selection type only) */}
      {pkg.type === 'selection' && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Categories</h2>
              <p className="text-sm text-gray-500">Categories that customers will select items from</p>
            </div>
            <button
              onClick={() => setShowAddCategory(true)}
              className="text-sm text-primary hover:underline"
            >
              + Add Category
            </button>
          </div>

          {/* Add Category Modal */}
          {showAddCategory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h2 className="text-lg font-semibold mb-4">Add Category</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="e.g., Salads"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                      type="url"
                      value={newCategory.imageUrl}
                      onChange={(e) => setNewCategory({ ...newCategory, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <button
                    onClick={() => setShowAddCategory(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addCategory}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                  >
                    Add Category
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Category Item Modal */}
          {showAddCategoryItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h2 className="text-lg font-semibold mb-4">Add Item</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                    <input
                      type="text"
                      value={newCategoryItem.name}
                      onChange={(e) => setNewCategoryItem({ ...newCategoryItem, name: e.target.value })}
                      placeholder="e.g., Caesar Salad"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newCategoryItem.description}
                      onChange={(e) => setNewCategoryItem({ ...newCategoryItem, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <button
                    onClick={() => setShowAddCategoryItem(null)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => addCategoryItem(showAddCategoryItem)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="divide-y">
            {pkg.categories.length === 0 ? (
              <div className="p-4 text-gray-500 text-sm">No categories yet. Add your first category.</div>
            ) : (
              pkg.categories.map((category) => (
                <div key={category.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium">{category.name}</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAddCategoryItem(category.id)}
                        className="text-sm text-primary hover:underline"
                      >
                        + Add Item
                      </button>
                      <button
                        onClick={() => deleteCategory(category.id)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {category.items.length === 0 ? (
                    <div className="text-sm text-gray-400 pl-4">No items in this category</div>
                  ) : (
                    <div className="pl-4 space-y-2">
                      {category.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-1">
                          <div>
                            <span className="text-sm">{item.name}</span>
                            {item.description && (
                              <span className="text-xs text-gray-400 ml-2">- {item.description}</span>
                            )}
                          </div>
                          <button
                            onClick={() => deleteCategoryItem(category.id, item.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Items Section (Quantity and Fixed types) */}
      {(pkg.type === 'quantity' || pkg.type === 'fixed') && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Items</h2>
              <p className="text-sm text-gray-500">
                {pkg.type === 'quantity'
                  ? 'Items with tier-based pricing (e.g., Meatballs at different quantities)'
                  : 'Items with fixed prices'}
              </p>
            </div>
            <button
              onClick={() => {
                // Initialize tier prices for quantity type
                if (pkg.type === 'quantity') {
                  const tierPrices: Record<string, string> = {}
                  pkg.tiers.forEach((tier) => {
                    tierPrices[tier.id] = tier.price
                  })
                  setNewItem({ ...newItem, tierPrices })
                }
                setShowAddItem(true)
              }}
              className="text-sm text-primary hover:underline"
            >
              + Add Item
            </button>
          </div>

          {/* Add Item Modal */}
          {showAddItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4">Add Item</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder={pkg.type === 'quantity' ? 'e.g., Meatballs' : 'e.g., Assorted Desserts Platter'}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Badge</label>
                    <input
                      type="text"
                      value={newItem.badge}
                      onChange={(e) => setNewItem({ ...newItem, badge: e.target.value })}
                      placeholder="e.g., MOST POPULAR"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                      type="url"
                      value={newItem.imageUrl}
                      onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  {pkg.type === 'fixed' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newItem.price}
                        onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  )}

                  {pkg.type === 'quantity' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tier Prices</label>
                      {pkg.tiers.length === 0 ? (
                        <div className="text-sm text-gray-500">Add tiers first to set prices</div>
                      ) : (
                        <div className="space-y-2">
                          {pkg.tiers.map((tier) => (
                            <div key={tier.id} className="flex items-center gap-2">
                              <span className="text-sm w-24">{tier.name}:</span>
                              <input
                                type="number"
                                step="0.01"
                                value={newItem.tierPrices[tier.id] || ''}
                                onChange={(e) => setNewItem({
                                  ...newItem,
                                  tierPrices: { ...newItem.tierPrices, [tier.id]: e.target.value }
                                })}
                                placeholder={`$${parseFloat(tier.price).toFixed(2)}`}
                                className="flex-1 px-3 py-2 border rounded-lg"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <button
                    onClick={() => {
                      setShowAddItem(false)
                      setNewItem({ name: '', description: '', imageUrl: '', price: '', badge: '', tierPrices: {} })
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addItem}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="divide-y">
            {pkg.items.length === 0 ? (
              <div className="p-4 text-gray-500 text-sm">No items yet. Add your first item.</div>
            ) : (
              pkg.items.map((item) => (
                <div key={item.id} className="p-4 flex items-start justify-between">
                  <div className="flex gap-3">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded object-cover" />
                    )}
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {item.name}
                        {item.badge && (
                          <span className="bg-accent text-white text-xs px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.description && <div className="text-sm text-gray-500">{item.description}</div>}
                      {pkg.type === 'fixed' && item.price && (
                        <div className="text-sm text-primary font-medium">${parseFloat(item.price).toFixed(2)}</div>
                      )}
                      {pkg.type === 'quantity' && item.tierPrices && (
                        <div className="text-xs text-gray-500 mt-1">
                          {pkg.tiers.map((tier) => (
                            <span key={tier.id} className="mr-3">
                              {tier.name}: ${item.tierPrices?.[tier.id] ? parseFloat(item.tierPrices[tier.id]).toFixed(2) : '-'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Upgrades Section (Selection type only) */}
      {pkg.type === 'selection' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Premium Upgrades</h2>
              <p className="text-sm text-gray-500">Optional add-ons with per-person pricing</p>
            </div>
            <button
              onClick={() => setShowAddUpgrade(true)}
              className="text-sm text-primary hover:underline"
            >
              + Add Upgrade
            </button>
          </div>

          {/* Add Upgrade Modal */}
          {showAddUpgrade && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h2 className="text-lg font-semibold mb-4">Add Upgrade</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upgrade Name *</label>
                    <input
                      type="text"
                      value={newUpgrade.name}
                      onChange={(e) => setNewUpgrade({ ...newUpgrade, name: e.target.value })}
                      placeholder="e.g., Prime Beef"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newUpgrade.description}
                      onChange={(e) => setNewUpgrade({ ...newUpgrade, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price per Person *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newUpgrade.pricePerPerson}
                      onChange={(e) => setNewUpgrade({ ...newUpgrade, pricePerPerson: e.target.value })}
                      placeholder="e.g., 19.00"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <button
                    onClick={() => setShowAddUpgrade(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addUpgrade}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                  >
                    Add Upgrade
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upgrades List */}
          <div className="divide-y">
            {pkg.upgrades.length === 0 ? (
              <div className="p-4 text-gray-500 text-sm">No upgrades yet. Add optional premium upgrades.</div>
            ) : (
              pkg.upgrades.map((upgrade) => (
                <div key={upgrade.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{upgrade.name}</div>
                    {upgrade.description && <div className="text-sm text-gray-500">{upgrade.description}</div>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-primary font-semibold">
                      +${parseFloat(upgrade.pricePerPerson).toFixed(2)}/person
                    </div>
                    <button
                      onClick={() => deleteUpgrade(upgrade.id)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

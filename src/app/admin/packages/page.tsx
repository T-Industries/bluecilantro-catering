'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface PackageTier {
  id: string
  name: string
  price: string
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
}

const packageTypeLabels = {
  selection: 'Selection Package',
  quantity: 'Quantity Package',
  fixed: 'Fixed Price Package',
}

const packageTypeDescriptions = {
  selection: 'Customers pick a tier, select items from categories, and choose guest count',
  quantity: 'Items priced by quantity tiers (e.g., Half Dozen, Full Dozen)',
  fixed: 'Items with fixed prices and quantity selection',
}

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<MenuPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPackage, setNewPackage] = useState({
    name: '',
    description: '',
    type: 'selection' as 'selection' | 'quantity' | 'fixed',
    badge: '',
    minGuests: '',
    imageUrl: '',
  })

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/packages')
      const data = await response.json()
      setPackages(data)
    } catch (err) {
      console.error('Failed to fetch packages:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const createPackage = async () => {
    if (!newPackage.name || !newPackage.type) return

    try {
      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPackage.name,
          description: newPackage.description || null,
          type: newPackage.type,
          badge: newPackage.badge || null,
          minGuests: newPackage.minGuests ? parseInt(newPackage.minGuests) : null,
          imageUrl: newPackage.imageUrl || null,
        }),
      })

      if (response.ok) {
        setNewPackage({
          name: '',
          description: '',
          type: 'selection',
          badge: '',
          minGuests: '',
          imageUrl: '',
        })
        setShowCreateModal(false)
        fetchPackages()
      }
    } catch (err) {
      console.error('Failed to create package:', err)
    }
  }

  const togglePackageActive = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/packages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      })
      fetchPackages()
    } catch (err) {
      console.error('Failed to toggle package:', err)
    }
  }

  const deletePackage = async (id: string) => {
    if (!confirm('Delete this package and all its tiers, categories, items, and upgrades?')) return

    try {
      await fetch(`/api/packages/${id}`, { method: 'DELETE' })
      fetchPackages()
    } catch (err) {
      console.error('Failed to delete package:', err)
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center">Loading packages...</div>
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Package Management</h1>
          <p className="text-gray-600">Create and manage catering packages</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
        >
          + Create Package
        </button>
      </div>

      {/* Create Package Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Create New Package</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Package Name *</label>
                <input
                  type="text"
                  value={newPackage.name}
                  onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                  placeholder="e.g., Select & Choose Package"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Package Type *</label>
                <div className="space-y-2">
                  {(['selection', 'quantity', 'fixed'] as const).map((type) => (
                    <label
                      key={type}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        newPackage.type === type ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="packageType"
                        value={type}
                        checked={newPackage.type === type}
                        onChange={(e) => setNewPackage({ ...newPackage, type: e.target.value as typeof type })}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium">{packageTypeLabels[type]}</div>
                        <div className="text-sm text-gray-500">{packageTypeDescriptions[type]}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newPackage.description}
                  onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                  placeholder="Optional description shown to customers"
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Badge</label>
                  <input
                    type="text"
                    value={newPackage.badge}
                    onChange={(e) => setNewPackage({ ...newPackage, badge: e.target.value })}
                    placeholder="e.g., MOST POPULAR"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                {newPackage.type === 'selection' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Guests</label>
                    <input
                      type="number"
                      value={newPackage.minGuests}
                      onChange={(e) => setNewPackage({ ...newPackage, minGuests: e.target.value })}
                      placeholder="e.g., 10"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={newPackage.imageUrl}
                  onChange={(e) => setNewPackage({ ...newPackage, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={createPackage}
                disabled={!newPackage.name}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                Create Package
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Package List */}
      {packages.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 text-5xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No packages yet</h3>
          <p className="text-gray-500 mb-4">Create your first catering package to get started.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
          >
            + Create Package
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-white rounded-lg shadow overflow-hidden ${!pkg.active ? 'opacity-60' : ''}`}
            >
              {pkg.imageUrl && (
                <img
                  src={pkg.imageUrl}
                  alt={pkg.name}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{pkg.name}</h3>
                  {pkg.badge && (
                    <span className="bg-accent text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                      {pkg.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    pkg.type === 'selection' ? 'bg-blue-100 text-blue-700' :
                    pkg.type === 'quantity' ? 'bg-green-100 text-green-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {packageTypeLabels[pkg.type]}
                  </span>
                  {!pkg.active && (
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">Hidden</span>
                  )}
                </div>

                {pkg.description && (
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">{pkg.description}</p>
                )}

                {pkg.type === 'selection' && pkg.minGuests && (
                  <p className="text-sm text-gray-500 mb-2">Min {pkg.minGuests} guests</p>
                )}

                {pkg.tiers.length > 0 && (
                  <div className="text-sm text-gray-600 mb-3">
                    {pkg.tiers.length} tier{pkg.tiers.length !== 1 ? 's' : ''}
                    {pkg.type === 'selection' && pkg.tiers.length > 0 && (
                      <span className="text-primary">
                        {' '}(${parseFloat(pkg.tiers[0].price).toFixed(0)}
                        {pkg.tiers.length > 1 && ` - $${parseFloat(pkg.tiers[pkg.tiers.length - 1].price).toFixed(0)}`}
                        /person)
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t">
                  <Link
                    href={`/admin/packages/${pkg.id}`}
                    className="flex-1 text-center text-sm text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors"
                  >
                    Edit Package
                  </Link>
                  <button
                    onClick={() => togglePackageActive(pkg.id, !pkg.active)}
                    className="text-sm text-gray-500 hover:text-gray-700 px-2 py-2"
                  >
                    {pkg.active ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => deletePackage(pkg.id)}
                    className="text-sm text-red-500 hover:text-red-700 px-2 py-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

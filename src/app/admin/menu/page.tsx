'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: string
  pricingType: string
  servesCount: number | null
  imageUrl: string | null
  active: boolean
  displayOrder: number
}

interface MenuCategory {
  id: string
  name: string
  displayOrder: number
  active: boolean
  items: MenuItem[]
}

export default function AdminMenuPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddItem, setShowAddItem] = useState<string | null>(null)

  // New item form state
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    pricingType: 'fixed',
    servesCount: '',
    imageUrl: '',
  })

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    try {
      const response = await fetch('/api/menu/categories')
      const data = await response.json()
      setCategories(data)
    } catch (err) {
      console.error('Failed to fetch menu:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const addCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      await fetch('/api/menu/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      })
      setNewCategoryName('')
      setShowAddCategory(false)
      fetchMenu()
    } catch (err) {
      console.error('Failed to add category:', err)
    }
  }

  const updateCategory = async (id: string, name: string) => {
    try {
      await fetch(`/api/menu/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      setEditingCategory(null)
      fetchMenu()
    } catch (err) {
      console.error('Failed to update category:', err)
    }
  }

  const toggleCategoryActive = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/menu/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      })
      fetchMenu()
    } catch (err) {
      console.error('Failed to toggle category:', err)
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category and all its items?')) return

    try {
      await fetch(`/api/menu/categories/${id}`, { method: 'DELETE' })
      fetchMenu()
    } catch (err) {
      console.error('Failed to delete category:', err)
    }
  }

  const addItem = async (categoryId: string) => {
    if (!newItem.name || !newItem.price) return

    try {
      await fetch('/api/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newItem,
          categoryId,
          price: parseFloat(newItem.price),
          servesCount: newItem.servesCount ? parseInt(newItem.servesCount) : null,
        }),
      })
      setNewItem({ name: '', description: '', price: '', pricingType: 'fixed', servesCount: '', imageUrl: '' })
      setShowAddItem(null)
      fetchMenu()
    } catch (err) {
      console.error('Failed to add item:', err)
    }
  }

  const toggleItemActive = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/menu/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      })
      fetchMenu()
    } catch (err) {
      console.error('Failed to toggle item:', err)
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this menu item?')) return

    try {
      await fetch(`/api/menu/items/${id}`, { method: 'DELETE' })
      fetchMenu()
    } catch (err) {
      console.error('Failed to delete item:', err)
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center">Loading menu...</div>
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-gray-600">Manage categories and menu items</p>
        </div>
        <button
          onClick={() => setShowAddCategory(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
        >
          + Add Category
        </button>
      </div>

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">Add Category</h2>
            <input
              type="text"
              placeholder="Category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg mb-4"
            />
            <div className="flex gap-2 justify-end">
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
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex items-center justify-between">
              {editingCategory === category.id ? (
                <input
                  type="text"
                  defaultValue={category.name}
                  onBlur={(e) => updateCategory(category.id, e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && updateCategory(category.id, (e.target as HTMLInputElement).value)}
                  className="text-lg font-semibold px-2 py-1 border rounded"
                  autoFocus
                />
              ) : (
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {category.name}
                  {!category.active && (
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">Hidden</span>
                  )}
                </h2>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddItem(category.id)}
                  className="text-sm text-primary hover:underline"
                >
                  + Add Item
                </button>
                <button
                  onClick={() => setEditingCategory(category.id)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleCategoryActive(category.id, !category.active)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {category.active ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => deleteCategory(category.id)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Add Item Form */}
            {showAddItem === category.id && (
              <div className="p-4 bg-gray-50 border-b">
                <h3 className="font-medium mb-3">Add New Item</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Item name *"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price *"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <textarea
                    placeholder="Description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="px-3 py-2 border rounded-lg md:col-span-2"
                  />
                  <select
                    value={newItem.pricingType}
                    onChange={(e) => setNewItem({ ...newItem, pricingType: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  >
                    <option value="fixed">Fixed Price</option>
                    <option value="per_person">Per Person</option>
                  </select>
                  {newItem.pricingType === 'per_person' && (
                    <input
                      type="number"
                      placeholder="Min guests (e.g., 10)"
                      value={newItem.servesCount}
                      onChange={(e) => setNewItem({ ...newItem, servesCount: e.target.value })}
                      className="px-3 py-2 border rounded-lg"
                    />
                  )}
                  <input
                    type="url"
                    placeholder="Image URL"
                    value={newItem.imageUrl}
                    onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                    className="px-3 py-2 border rounded-lg md:col-span-2"
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setShowAddItem(null)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => addItem(category.id)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            )}

            {/* Items */}
            <div className="divide-y">
              {category.items.length === 0 ? (
                <div className="p-4 text-gray-500 text-sm">No items in this category</div>
              ) : (
                category.items.map((item) => (
                  <div key={item.id} className={`p-4 flex gap-4 ${!item.active ? 'opacity-50' : ''}`}>
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-primary">
                            ${parseFloat(item.price).toFixed(2)}
                            {item.pricingType === 'per_person' && (
                              <span className="text-sm text-gray-500">/person</span>
                            )}
                          </div>
                          {item.servesCount && (
                            <div className="text-xs text-gray-500">Min {item.servesCount} guests</div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => toggleItemActive(item.id, !item.active)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          {item.active ? 'Hide' : 'Show'}
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

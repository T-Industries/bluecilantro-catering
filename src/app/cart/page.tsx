'use client'

import { useCartContext } from '@/components/CartProvider'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PackageCartItemSelection, PackageCartItemQuantity } from '@/types'

export default function CartPage() {
  const {
    cart,
    isLoaded,
    updateItemQuantity,
    updateItemNotes,
    updateItemGuestCount,
    removeItem,
    removePackageItem,
    updatePackageItemNotes,
    getSubtotal,
  } = useCartContext()

  const [deliveryFee, setDeliveryFee] = useState(25)

  useEffect(() => {
    // Fetch delivery fee from settings
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.delivery_fee) {
          setDeliveryFee(parseFloat(data.delivery_fee))
        }
      })
      .catch(console.error)
  }, [])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading cart...</div>
      </div>
    )
  }

  const subtotal = getSubtotal()
  const total = subtotal + (cart.fulfillmentType === 'delivery' ? deliveryFee : 0)
  const hasItems = cart.items.length > 0 || cart.packageItems.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold hover:text-gray-200">
              BlueCilantro
            </Link>
            <h1 className="text-xl font-semibold">Your Cart</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!hasItems ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Add some delicious items from our menu!</p>
            <Link
              href="/"
              className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Standard Menu Items */}
            {cart.items.length > 0 && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                  <h2 className="text-lg font-semibold">A La Carte Items</h2>
                </div>
                <div className="divide-y">
                  {cart.items.map((item) => (
                    <div key={item.menuItemId} className="p-4">
                      <div className="flex gap-4">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{item.name}</h3>
                              <p className="text-primary font-medium">
                                ${item.price.toFixed(2)}
                                {item.pricingType === 'per_person' && (
                                  <span className="text-sm text-gray-500">/person</span>
                                )}
                              </p>
                            </div>
                            <button
                              onClick={() => removeItem(item.menuItemId)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-4 items-center">
                            {/* Quantity */}
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-600">Qty:</label>
                              <div className="flex items-center border rounded">
                                <button
                                  onClick={() => updateItemQuantity(item.menuItemId, item.quantity - 1)}
                                  className="px-3 py-1 hover:bg-gray-100"
                                >
                                  -
                                </button>
                                <span className="px-3 py-1 border-x">{item.quantity}</span>
                                <button
                                  onClick={() => updateItemQuantity(item.menuItemId, item.quantity + 1)}
                                  className="px-3 py-1 hover:bg-gray-100"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Guest Count for per-person pricing */}
                            {item.pricingType === 'per_person' && (
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Guests:</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.guestCount || 10}
                                  onChange={(e) =>
                                    updateItemGuestCount(item.menuItemId, parseInt(e.target.value) || 1)
                                  }
                                  className="w-20 px-2 py-1 border rounded"
                                />
                              </div>
                            )}
                          </div>

                          {/* Item Notes */}
                          <div className="mt-3">
                            <input
                              type="text"
                              placeholder="Special instructions for this item..."
                              value={item.notes || ''}
                              onChange={(e) => updateItemNotes(item.menuItemId, e.target.value)}
                              className="w-full px-3 py-2 border rounded text-sm"
                            />
                          </div>

                          {/* Line Total */}
                          <div className="mt-2 text-right">
                            <span className="font-semibold text-primary">
                              $
                              {(
                                item.price *
                                item.quantity *
                                (item.pricingType === 'per_person' ? item.guestCount || 10 : 1)
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Package Items */}
            {cart.packageItems.length > 0 && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 bg-blue-50 border-b">
                  <h2 className="text-lg font-semibold">Package Items</h2>
                </div>
                <div className="divide-y">
                  {cart.packageItems.map((pkgItem) => (
                    <div key={pkgItem.id} className="p-4">
                      {pkgItem.type === 'package_selection' ? (
                        // Selection Package Display
                        <SelectionPackageDisplay
                          item={pkgItem as PackageCartItemSelection}
                          onRemove={() => removePackageItem(pkgItem.id)}
                          onUpdateNotes={(notes) => updatePackageItemNotes(pkgItem.id, notes)}
                        />
                      ) : (
                        // Quantity/Fixed Package Display
                        <QuantityPackageDisplay
                          item={pkgItem as PackageCartItemQuantity}
                          onRemove={() => removePackageItem(pkgItem.id)}
                          onUpdateNotes={(notes) => updatePackageItemNotes(pkgItem.id, notes)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {cart.fulfillmentType === 'delivery' && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                * Prices do not include taxes. Final amount will be confirmed upon order.
              </p>

              <div className="mt-6 space-y-3">
                <Link
                  href="/checkout"
                  className="block w-full bg-primary text-white text-center py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  href="/"
                  className="block w-full text-center py-3 rounded-lg font-semibold text-primary hover:bg-gray-100 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// Selection Package Display Component
function SelectionPackageDisplay({
  item,
  onRemove,
  onUpdateNotes,
}: {
  item: PackageCartItemSelection
  onRemove: () => void
  onUpdateNotes: (notes: string) => void
}) {
  return (
    <div>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{item.packageName}</h3>
          <p className="text-sm text-gray-600">
            {item.tierName} - {item.guestCount} guests
          </p>
        </div>
        <button onClick={onRemove} className="text-red-500 hover:text-red-700 text-sm">
          Remove
        </button>
      </div>

      {/* Selections Summary */}
      <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm">
        <div className="font-medium mb-2">Your Selections:</div>
        {item.selections.map((sel) => (
          <div key={sel.categoryId} className="mb-1">
            <span className="text-gray-600">{sel.categoryName}:</span>{' '}
            <span>{sel.items.map((i) => i.name).join(', ')}</span>
          </div>
        ))}
      </div>

      {/* Upgrades */}
      {item.upgrades.length > 0 && (
        <div className="mt-2 text-sm">
          <span className="text-gray-600">Upgrades:</span>{' '}
          <span className="text-primary">
            {item.upgrades.map((u) => `${u.name} (+$${u.pricePerPerson.toFixed(2)}/person)`).join(', ')}
          </span>
        </div>
      )}

      {/* Price Breakdown */}
      <div className="mt-3 text-sm text-gray-600">
        <div>Base: ${item.tierPrice.toFixed(2)}/person x {item.guestCount} guests = ${(item.tierPrice * item.guestCount).toFixed(2)}</div>
        {item.upgrades.length > 0 && (
          <div>
            Upgrades: $
            {item.upgrades.reduce((sum, u) => sum + u.pricePerPerson, 0).toFixed(2)}/person x {item.guestCount} guests = $
            {(item.upgrades.reduce((sum, u) => sum + u.pricePerPerson, 0) * item.guestCount).toFixed(2)}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="mt-3">
        <input
          type="text"
          placeholder="Special instructions for this package..."
          value={item.notes || ''}
          onChange={(e) => onUpdateNotes(e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
        />
      </div>

      {/* Total */}
      <div className="mt-2 text-right">
        <span className="font-semibold text-primary text-lg">${item.total.toFixed(2)}</span>
      </div>
    </div>
  )
}

// Quantity/Fixed Package Display Component
function QuantityPackageDisplay({
  item,
  onRemove,
  onUpdateNotes,
}: {
  item: PackageCartItemQuantity
  onRemove: () => void
  onUpdateNotes: (notes: string) => void
}) {
  return (
    <div>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{item.itemName}</h3>
          <p className="text-sm text-gray-500">from {item.packageName}</p>
          {item.tierName && (
            <p className="text-sm text-gray-600">{item.tierName}</p>
          )}
        </div>
        <button onClick={onRemove} className="text-red-500 hover:text-red-700 text-sm">
          Remove
        </button>
      </div>

      <div className="mt-2 text-sm text-gray-600">
        ${item.unitPrice.toFixed(2)} x {item.quantity} = ${item.total.toFixed(2)}
      </div>

      {/* Notes */}
      <div className="mt-3">
        <input
          type="text"
          placeholder="Special instructions..."
          value={item.notes || ''}
          onChange={(e) => onUpdateNotes(e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
        />
      </div>

      {/* Total */}
      <div className="mt-2 text-right">
        <span className="font-semibold text-primary">${item.total.toFixed(2)}</span>
      </div>
    </div>
  )
}

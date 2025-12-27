'use client'

import { useState } from 'react'
import { useCartContext } from '@/components/CartProvider'

interface MenuItemProps {
  item: {
    id: string
    name: string
    description: string | null
    price: number | { toString: () => string }
    pricingType: string
    servesCount: number | null
    imageUrl: string | null
  }
}

export function MenuItemCard({ item }: MenuItemProps) {
  const { addItem } = useCartContext()
  const [isAdding, setIsAdding] = useState(false)
  const [showAdded, setShowAdded] = useState(false)

  const price = typeof item.price === 'object' ? parseFloat(item.price.toString()) : item.price
  const formattedPrice = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(price)

  const handleAddToCart = () => {
    setIsAdding(true)

    addItem({
      menuItemId: item.id,
      name: item.name,
      price: price,
      pricingType: item.pricingType as 'fixed' | 'per_person',
      imageUrl: item.imageUrl || undefined,
      guestCount: item.pricingType === 'per_person' ? 10 : undefined,
    })

    setShowAdded(true)
    setTimeout(() => {
      setShowAdded(false)
      setIsAdding(false)
    }, 1500)
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {item.imageUrl && (
        <div className="h-48 overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-lg">{item.name}</h4>
          <span className="text-primary font-bold">
            {formattedPrice}
            {item.pricingType === 'per_person' && (
              <span className="text-sm font-normal text-gray-500">/person</span>
            )}
          </span>
        </div>
        {item.description && (
          <p className="text-gray-600 text-sm mb-3">{item.description}</p>
        )}
        {item.servesCount && (
          <p className="text-sm text-gray-500 mb-3">Serves {item.servesCount}+ guests</p>
        )}
        <button
          onClick={handleAddToCart}
          disabled={isAdding}
          className={`w-full py-2 rounded-lg transition-colors font-medium ${
            showAdded
              ? 'bg-green-600 text-white'
              : 'bg-primary text-white hover:bg-primary-dark'
          }`}
        >
          {showAdded ? '✓ Added!' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}

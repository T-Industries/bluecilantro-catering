'use client'

import Link from 'next/link'
import { useCartContext } from '@/components/CartProvider'

export function CartButton() {
  const { getItemCount, isLoaded } = useCartContext()
  const itemCount = isLoaded ? getItemCount() : 0

  return (
    <Link
      href="/cart"
      className="bg-white text-primary px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors relative"
    >
      View Cart
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-accent text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </Link>
  )
}

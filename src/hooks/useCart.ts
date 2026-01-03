'use client'

import { useState, useEffect, useCallback } from 'react'
import { CartItem, PackageCartItem, PackageCartItemSelection, PackageCartItemQuantity } from '@/types'

const CART_STORAGE_KEY = 'bluecilantro_cart'

export interface CartState {
  items: CartItem[]
  packageItems: PackageCartItem[]
  fulfillmentType: 'delivery' | 'pickup'
  scheduledDate: string
  scheduledTime: string
  notes: string
}

const defaultCartState: CartState = {
  items: [],
  packageItems: [],
  fulfillmentType: 'delivery',
  scheduledDate: '',
  scheduledTime: '',
  notes: '',
}

export function useCart() {
  const [cart, setCart] = useState<CartState>(defaultCartState)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          // Ensure packageItems array exists (for backwards compatibility)
          setCart({
            ...defaultCartState,
            ...parsed,
            packageItems: parsed.packageItems || [],
          })
        } catch (e) {
          console.error('Failed to parse cart from localStorage', e)
        }
      }
      setIsLoaded(true)
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    }
  }, [cart, isLoaded])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setCart((prev) => {
      const existingIndex = prev.items.findIndex(
        (i) => i.menuItemId === item.menuItemId && i.notes === (item.notes || '')
      )

      if (existingIndex >= 0) {
        // Update quantity of existing item
        const newItems = [...prev.items]
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + (item.quantity || 1),
        }
        return { ...prev, items: newItems }
      }

      // Add new item
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            ...item,
            quantity: item.quantity || 1,
            notes: item.notes || '',
          },
        ],
      }
    })
  }, [])

  const updateItemQuantity = useCallback((menuItemId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return {
          ...prev,
          items: prev.items.filter((i) => i.menuItemId !== menuItemId),
        }
      }

      return {
        ...prev,
        items: prev.items.map((i) =>
          i.menuItemId === menuItemId ? { ...i, quantity } : i
        ),
      }
    })
  }, [])

  const updateItemNotes = useCallback((menuItemId: string, notes: string) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.menuItemId === menuItemId ? { ...i, notes } : i
      ),
    }))
  }, [])

  const updateItemGuestCount = useCallback((menuItemId: string, guestCount: number) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.menuItemId === menuItemId ? { ...i, guestCount } : i
      ),
    }))
  }, [])

  const removeItem = useCallback((menuItemId: string) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.menuItemId !== menuItemId),
    }))
  }, [])

  const setFulfillmentType = useCallback((type: 'delivery' | 'pickup') => {
    setCart((prev) => ({ ...prev, fulfillmentType: type }))
  }, [])

  const setScheduledDate = useCallback((date: string) => {
    setCart((prev) => ({ ...prev, scheduledDate: date }))
  }, [])

  const setScheduledTime = useCallback((time: string) => {
    setCart((prev) => ({ ...prev, scheduledTime: time }))
  }, [])

  const setNotes = useCallback((notes: string) => {
    setCart((prev) => ({ ...prev, notes }))
  }, [])

  const clearCart = useCallback(() => {
    setCart(defaultCartState)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CART_STORAGE_KEY)
    }
  }, [])

  // Package cart functions
  interface AddPackageParams {
    packageId: string
    packageName: string
    packageType: 'selection' | 'quantity' | 'fixed'
    // For selection packages
    tierId?: string
    tierName?: string
    tierPrice?: number
    guestCount?: number
    selections?: {
      categoryId: string
      categoryName: string
      items: { id: string; name: string }[]
    }[]
    upgrades?: {
      id: string
      name: string
      pricePerPerson: number
    }[]
    // For quantity/fixed packages
    itemId?: string
    itemName?: string
    quantity?: number
    unitPrice?: number
    total: number
  }

  const addPackageToCart = useCallback((params: AddPackageParams) => {
    setCart((prev) => {
      const id = `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      if (params.packageType === 'selection') {
        const newItem: PackageCartItemSelection = {
          id,
          type: 'package_selection',
          packageId: params.packageId,
          packageName: params.packageName,
          tierId: params.tierId!,
          tierName: params.tierName!,
          tierPrice: params.tierPrice!,
          guestCount: params.guestCount!,
          selections: params.selections || [],
          upgrades: params.upgrades || [],
          total: params.total,
        }
        return {
          ...prev,
          packageItems: [...prev.packageItems, newItem],
        }
      } else {
        const newItem: PackageCartItemQuantity = {
          id,
          type: params.packageType === 'quantity' ? 'package_quantity' : 'package_fixed',
          packageId: params.packageId,
          packageName: params.packageName,
          itemId: params.itemId!,
          itemName: params.itemName!,
          tierId: params.tierId,
          tierName: params.tierName,
          quantity: params.quantity!,
          unitPrice: params.unitPrice!,
          total: params.total,
        }
        return {
          ...prev,
          packageItems: [...prev.packageItems, newItem],
        }
      }
    })
  }, [])

  const removePackageItem = useCallback((packageItemId: string) => {
    setCart((prev) => ({
      ...prev,
      packageItems: prev.packageItems.filter((p) => p.id !== packageItemId),
    }))
  }, [])

  const updatePackageItemNotes = useCallback((packageItemId: string, notes: string) => {
    setCart((prev) => ({
      ...prev,
      packageItems: prev.packageItems.map((p) =>
        p.id === packageItemId ? { ...p, notes } : p
      ),
    }))
  }, [])

  const getSubtotal = useCallback(() => {
    const itemsTotal = (cart.items || []).reduce((total, item) => {
      if (item.pricingType === 'per_person' && item.guestCount) {
        return total + item.price * item.guestCount * item.quantity
      }
      return total + item.price * item.quantity
    }, 0)

    const packagesTotal = (cart.packageItems || []).reduce((total, pkg) => total + pkg.total, 0)

    return itemsTotal + packagesTotal
  }, [cart.items, cart.packageItems])

  const getItemCount = useCallback(() => {
    const menuItemCount = (cart.items || []).reduce((count, item) => count + item.quantity, 0)
    const packageItemCount = (cart.packageItems || []).length
    return menuItemCount + packageItemCount
  }, [cart.items, cart.packageItems])

  return {
    cart,
    isLoaded,
    addItem,
    updateItemQuantity,
    updateItemNotes,
    updateItemGuestCount,
    removeItem,
    addPackageToCart,
    removePackageItem,
    updatePackageItemNotes,
    setFulfillmentType,
    setScheduledDate,
    setScheduledTime,
    setNotes,
    clearCart,
    getSubtotal,
    getItemCount,
  }
}

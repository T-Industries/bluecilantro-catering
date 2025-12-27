'use client'

import { useState, useEffect, useCallback } from 'react'
import { CartItem } from '@/types'

const CART_STORAGE_KEY = 'bluecilantro_cart'

export interface CartState {
  items: CartItem[]
  fulfillmentType: 'delivery' | 'pickup'
  scheduledDate: string
  scheduledTime: string
  notes: string
}

const defaultCartState: CartState = {
  items: [],
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
          setCart(JSON.parse(stored))
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

  const getSubtotal = useCallback(() => {
    return cart.items.reduce((total, item) => {
      if (item.pricingType === 'per_person' && item.guestCount) {
        return total + item.price * item.guestCount * item.quantity
      }
      return total + item.price * item.quantity
    }, 0)
  }, [cart.items])

  const getItemCount = useCallback(() => {
    return cart.items.reduce((count, item) => count + item.quantity, 0)
  }, [cart.items])

  return {
    cart,
    isLoaded,
    addItem,
    updateItemQuantity,
    updateItemNotes,
    updateItemGuestCount,
    removeItem,
    setFulfillmentType,
    setScheduledDate,
    setScheduledTime,
    setNotes,
    clearCart,
    getSubtotal,
    getItemCount,
  }
}

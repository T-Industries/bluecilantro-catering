'use client'

import { useCartContext } from '@/components/CartProvider'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, FormEvent } from 'react'

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, isLoaded, setFulfillmentType, setScheduledDate, setScheduledTime, setNotes, getSubtotal } =
    useCartContext()

  const [deliveryFee, setDeliveryFee] = useState(25)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Customer info
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [promoCode, setPromoCode] = useState('')

  // Get minimum date (24 hours from now)
  const getMinDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 1)
    return date.toISOString().split('T')[0]
  }

  useEffect(() => {
    // Always set to delivery (no pickup option)
    setFulfillmentType('delivery')

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.delivery_fee) {
          setDeliveryFee(parseFloat(data.delivery_fee))
        }
      })
      .catch(console.error)
  }, [setFulfillmentType])

  useEffect(() => {
    // Set default date if not set
    if (isLoaded && !cart.scheduledDate) {
      setScheduledDate(getMinDate())
    }
  }, [isLoaded, cart.scheduledDate, setScheduledDate])

  const subtotal = getSubtotal()
  const total = subtotal + deliveryFee

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const orderData = {
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        scheduledDate: cart.scheduledDate,
        scheduledTime: cart.scheduledTime,
        notes: cart.notes,
        promoCode: promoCode.trim(),
        items: cart.items.map((item) => ({
          menuItemId: item.menuItemId,
          itemName: item.name,
          itemPrice: item.price,
          pricingType: item.pricingType,
          quantity: item.quantity,
          guestCount: item.pricingType === 'per_person' ? item.guestCount || 10 : null,
          notes: item.notes,
        })),
        subtotal,
        deliveryFee,
        total,
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create checkout')
      }

      // Redirect to payment (cart is cleared on success page)
      // If bypass mode, redirect to bypass URL, otherwise to Stripe Checkout
      window.location.href = result.bypassUrl || result.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsSubmitting(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some items before checking out!</p>
          <Link
            href="/"
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold hover:text-gray-200">
              BlueCilantro
            </Link>
            <h1 className="text-xl font-semibold">Checkout</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Time */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">When do you need it?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  min={getMinDate()}
                  value={cart.scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <p className="text-xs text-gray-500 mt-1">Orders require 24-hour advance notice</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 12:00 PM, Noon, 6:30 PM"
                  value={cart.scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Your Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Street address, city, postal code"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Order Notes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Additional Notes</h2>
            <textarea
              rows={3}
              value={cart.notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or dietary requirements..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Promo Code */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Have a promo code?</h2>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter code"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

            <div className="divide-y">
              {cart.items.map((item) => (
                <div key={item.menuItemId} className="py-3 flex justify-between">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-500 ml-2">
                      x{item.quantity}
                      {item.pricingType === 'per_person' && ` (${item.guestCount || 10} guests)`}
                    </span>
                  </div>
                  <span>
                    $
                    {(
                      item.price *
                      item.quantity *
                      (item.pricingType === 'per_person' ? item.guestCount || 10 : 1)
                    ).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t mt-4 pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              * Taxes (GST/HST/PST) will be calculated at checkout based on your delivery address.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-4 rounded-lg font-semibold text-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Redirecting to Payment...' : 'Proceed to Payment'}
            </button>
            <p className="text-center text-sm text-gray-500">
              You&apos;ll be redirected to secure checkout. Your card will be authorized but not charged until we confirm your order.
            </p>
            <Link
              href="/cart"
              className="block text-center text-primary hover:underline"
            >
              ← Back to Cart
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}

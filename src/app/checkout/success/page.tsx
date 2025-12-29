'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCartContext } from '@/components/CartProvider'

interface OrderData {
  id: string
  customerName: string
  customerEmail: string
  scheduledDate: string
  scheduledTime: string
  total: string
  paymentStatus: string
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const isBypass = searchParams.get('bypass') === 'true'
  const orderId = searchParams.get('order_id')
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { clearCart } = useCartContext()

  // Clear cart when order is successfully loaded
  useEffect(() => {
    if (order) {
      clearCart()
    }
  }, [order, clearCart])

  useEffect(() => {
    // Handle bypass mode (test order without payment)
    if (isBypass && orderId) {
      fetch(`/api/orders/${orderId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error)
          } else {
            setOrder(data)
          }
        })
        .catch(() => {
          setError('Failed to load order details')
        })
        .finally(() => {
          setLoading(false)
        })
      return
    }

    // Normal mode - fetch by session ID
    if (!sessionId) {
      setError('No session ID provided')
      setLoading(false)
      return
    }

    // Fetch order details by session ID
    fetch(`/api/checkout/session?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setOrder(data)
        }
      })
      .catch(() => {
        setError('Failed to load order details')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [sessionId, isBypass, orderId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Something went wrong</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            Back to Menu
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
          <Link href="/" className="text-2xl font-bold hover:text-gray-200">
            BlueCilantro
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Submitted!</h1>
          <p className="text-gray-600 mb-6">
            {isBypass
              ? 'This is a test order - no payment was processed.'
              : 'Thank you for your order. Your payment has been authorized.'}
          </p>

          {order && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h2 className="font-semibold text-lg mb-4">Order Details</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order ID:</span>
                  <span className="font-mono">{order.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span>{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Scheduled:</span>
                  <span>
                    {new Date(order.scheduledDate).toLocaleDateString('en-CA', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    at {order.scheduledTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total:</span>
                  <span className="font-semibold">${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {isBypass ? (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-purple-800 mb-2">Test Order</h3>
              <p className="text-sm text-purple-700">
                This order was created using a promo code bypass. No payment was processed.
                You can view and manage this order in the admin panel.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>We&apos;ll review your order and confirm availability</li>
                <li>Once confirmed, your card will be charged</li>
                <li>You&apos;ll receive a confirmation email</li>
                <li>We&apos;ll deliver your order at the scheduled time</li>
              </ol>
            </div>
          )}

          {!isBypass && (
            <p className="text-sm text-gray-500 mb-6">
              A confirmation email has been sent to <strong>{order?.customerEmail}</strong>
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {order && (
              <Link
                href={`/track?id=${order.id}`}
                className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                Track Order
              </Link>
            )}
            <Link
              href="/"
              className="inline-block bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Back to Menu
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

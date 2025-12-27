'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface OrderItem {
  itemName: string
  quantity: number
  guestCount: number | null
  lineTotal: string
}

interface Order {
  id: string
  status: string
  customerName: string
  fulfillmentType: string
  scheduledDate: string
  scheduledTime: string
  items: OrderItem[]
  subtotal: string
  deliveryFee: string
  total: string
  createdAt: string
}

export default function TrackOrderPage() {
  const searchParams = useSearchParams()
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Auto-search if ID is in URL
  useEffect(() => {
    const idFromUrl = searchParams.get('id')
    if (idFromUrl) {
      setOrderId(idFromUrl)
      searchOrder(idFromUrl)
    }
  }, [searchParams])

  const searchOrder = async (id: string) => {
    if (!id.trim()) {
      setError('Please enter an order ID')
      return
    }

    setIsLoading(true)
    setError('')
    setOrder(null)

    try {
      const response = await fetch(`/api/orders/lookup?id=${encodeURIComponent(id.trim())}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Order not found')
      }

      setOrder(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find order')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    searchOrder(orderId)
  }

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; description: string }> = {
      new: {
        label: 'Order Received',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        description: 'Your order has been received and is awaiting confirmation.',
      },
      confirmed: {
        label: 'Confirmed',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        description: 'Your order has been confirmed and is being prepared.',
      },
      completed: {
        label: 'Completed',
        color: 'bg-green-100 text-green-800 border-green-300',
        description: 'Your order has been completed. Thank you!',
      },
      cancelled: {
        label: 'Cancelled',
        color: 'bg-red-100 text-red-800 border-red-300',
        description: 'This order has been cancelled.',
      },
    }
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', description: '' }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <h1 className="text-2xl font-bold">BlueCilantro</h1>
            </Link>
            <Link
              href="/"
              className="text-sm hover:underline"
            >
              ← Back to Menu
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Track Your Order</h2>
          <p className="text-gray-600 mt-2">Enter your order ID to check the status</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter Order ID (e.g., a1b2c3d4)"
              className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-lg"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {error && (
            <div className="mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </form>

        {/* Order Details */}
        {order && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Status Banner */}
            {(() => {
              const statusInfo = getStatusInfo(order.status)
              return (
                <div className={`px-6 py-4 border-b-2 ${statusInfo.color}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-75">Order Status</p>
                      <p className="text-xl font-bold">{statusInfo.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-75">Order ID</p>
                      <p className="font-mono font-bold">{order.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm">{statusInfo.description}</p>
                </div>
              )
            })()}

            <div className="p-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium capitalize">{order.fulfillmentType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Scheduled Date</p>
                  <p className="font-medium">{formatDate(order.scheduledDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Scheduled Time</p>
                  <p className="font-medium">{order.scheduledTime}</p>
                </div>
              </div>

              {/* Items */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.itemName} x{item.quantity}
                        {item.guestCount && ` (${item.guestCount} guests)`}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(Number(item.lineTotal))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(Number(order.subtotal))}</span>
                </div>
                {Number(order.deliveryFee) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>{formatCurrency(Number(order.deliveryFee))}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(Number(order.total))}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                * Prices shown do not include taxes. Final amount may vary.
              </p>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Your order ID was sent to your email when you placed the order.</p>
          <p className="mt-2">
            Questions? <a href="mailto:gpwc@bluecilantro.ca" className="text-primary hover:underline">Contact us</a>
          </p>
        </div>
      </main>
    </div>
  )
}

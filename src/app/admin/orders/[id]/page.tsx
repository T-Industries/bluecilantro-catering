'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

interface OrderItem {
  id: string
  itemName: string
  itemPrice: string
  pricingType: string
  quantity: number
  guestCount: number | null
  lineTotal: string
  notes: string | null
}

interface Order {
  id: string
  status: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string | null
  fulfillmentType: string
  scheduledDate: string
  scheduledTime: string
  subtotal: string
  deliveryFee: string
  total: string
  notes: string | null
  createdAt: string
  items: OrderItem[]
  paymentStatus: string
  stripePaymentIntentId: string | null
  paidAt: string | null
}

export default function AdminOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (!response.ok) throw new Error('Order not found')
      const data = await response.json()
      setOrder(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order')
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update status')
      await fetchOrder()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setIsUpdating(false)
    }
  }

  const cancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to cancel order')
      router.push('/admin/orders')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel')
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="text-lg">Loading order...</div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">{error || 'Order not found'}</div>
        <Link href="/admin/orders" className="text-primary hover:underline">
          ← Back to Orders
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin/orders" className="text-primary hover:underline text-sm">
            ← Back to Orders
          </Link>
          <h1 className="text-2xl font-bold mt-2">Order #{order.id.slice(0, 8)}</h1>
          <p className="text-gray-500 text-sm">Created {formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Payment Information */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-semibold mb-3">Payment Information</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">Status:</span>
            <PaymentBadge status={order.paymentStatus} />
          </div>
          {order.paidAt && (
            <div className="text-sm text-gray-500">
              Paid on {formatDate(order.paidAt)}
            </div>
          )}
          {order.stripePaymentIntentId && (
            <a
              href={`https://dashboard.stripe.com/test/payments/${order.stripePaymentIntentId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View in Stripe →
            </a>
          )}
        </div>
        {order.paymentStatus === 'authorized' && (
          <p className="text-sm text-amber-600 mt-2">
            Payment is authorized but not yet captured. Confirming the order will charge the customer.
          </p>
        )}
      </div>

      {/* Status Actions */}
      {order.status !== 'cancelled' && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="font-semibold mb-3">Update Status</h2>
          <div className="flex flex-wrap gap-2">
            {order.status === 'new' && (
              <button
                onClick={() => updateStatus('confirmed')}
                disabled={isUpdating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {order.paymentStatus === 'authorized' ? 'Confirm & Capture Payment' : 'Confirm Order'}
              </button>
            )}
            {(order.status === 'new' || order.status === 'confirmed') && (
              <button
                onClick={() => updateStatus('completed')}
                disabled={isUpdating}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Mark Completed
              </button>
            )}
            {order.status !== 'completed' && (
              <button
                onClick={cancelOrder}
                disabled={isUpdating}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
              >
                {order.paymentStatus === 'authorized' ? 'Cancel & Release Payment' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Order Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4 text-lg">Customer Information</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Name</dt>
              <dd className="font-medium">{order.customerName}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd>
                <a href={`mailto:${order.customerEmail}`} className="text-primary hover:underline">
                  {order.customerEmail}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd>
                <a href={`tel:${order.customerPhone}`} className="text-primary hover:underline">
                  {order.customerPhone}
                </a>
              </dd>
            </div>
            {order.customerAddress && (
              <div>
                <dt className="text-gray-500">Address</dt>
                <dd>{order.customerAddress}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4 text-lg">Order Details</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Type</dt>
              <dd>
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                    order.fulfillmentType === 'delivery'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {order.fulfillmentType.toUpperCase()}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Scheduled Date</dt>
              <dd className="font-medium">{formatDate(order.scheduledDate)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Time</dt>
              <dd className="font-medium">{order.scheduledTime}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="font-semibold mb-4 text-lg">Order Items</h2>
        <div className="divide-y">
          {order.items.map((item) => (
            <div key={item.id} className="py-3 flex justify-between">
              <div>
                <div className="font-medium">{item.itemName}</div>
                <div className="text-sm text-gray-500">
                  {formatCurrency(parseFloat(item.itemPrice))} × {item.quantity}
                  {item.guestCount && ` (${item.guestCount} guests)`}
                </div>
                {item.notes && (
                  <div className="text-sm text-amber-600 mt-1">Note: {item.notes}</div>
                )}
              </div>
              <div className="font-medium">{formatCurrency(parseFloat(item.lineTotal))}</div>
            </div>
          ))}
        </div>

        <div className="border-t mt-4 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(parseFloat(order.subtotal))}</span>
          </div>
          {parseFloat(order.deliveryFee) > 0 && (
            <div className="flex justify-between text-sm">
              <span>Delivery Fee</span>
              <span>{formatCurrency(parseFloat(order.deliveryFee))}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg pt-2 border-t">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(parseFloat(order.total))}</span>
          </div>
        </div>
      </div>

      {/* Order Notes */}
      {order.notes && (
        <div className="bg-amber-50 rounded-lg p-6 mt-6">
          <h2 className="font-semibold mb-2">Order Notes</h2>
          <p className="text-gray-700">{order.notes}</p>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${styles[status] || 'bg-gray-100'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    authorized: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-purple-100 text-purple-800',
    test_bypass: 'bg-purple-100 text-purple-800',
  }

  const labels: Record<string, string> = {
    pending: 'Pending',
    authorized: 'Authorized',
    paid: 'Paid',
    failed: 'Failed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
    test_bypass: 'Test (No Payment)',
  }

  return (
    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  )
}

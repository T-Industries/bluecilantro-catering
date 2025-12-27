import { prisma } from '@/lib/db'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
  params: { orderId: string }
}

async function getOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  return order
}

export default async function ConfirmationPage({ params }: Props) {
  const order = await getOrder(params.orderId)

  if (!order) {
    notFound()
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

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-green-800 mb-2">Order Received!</h1>
          <p className="text-green-700">
            Thank you for your order. We&apos;ve received it and will be in touch soon.
          </p>
          <div className="mt-4 p-3 bg-white rounded-lg inline-block">
            <p className="text-sm text-gray-600">Your Order ID</p>
            <p className="text-2xl font-mono font-bold text-primary">{order.id.slice(0, 8)}</p>
            <p className="text-xs text-gray-500 mt-1">Save this to track your order</p>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-semibold">Order Details</h2>
              <p className="text-sm text-gray-500">Order ID: {order.id.slice(0, 8)}...</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                order.status === 'new'
                  ? 'bg-blue-100 text-blue-800'
                  : order.status === 'confirmed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Type:</span>
              <span className="ml-2 font-medium capitalize">{order.fulfillmentType}</span>
            </div>
            <div>
              <span className="text-gray-500">Date:</span>
              <span className="ml-2 font-medium">{formatDate(order.scheduledDate)}</span>
            </div>
            <div>
              <span className="text-gray-500">Time:</span>
              <span className="ml-2 font-medium">{order.scheduledTime}</span>
            </div>
            <div>
              <span className="text-gray-500">Placed:</span>
              <span className="ml-2 font-medium">{formatDate(order.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-500">Name:</span>
              <span className="ml-2">{order.customerName}</span>
            </p>
            <p>
              <span className="text-gray-500">Email:</span>
              <span className="ml-2">{order.customerEmail}</span>
            </p>
            <p>
              <span className="text-gray-500">Phone:</span>
              <span className="ml-2">{order.customerPhone}</span>
            </p>
            {order.customerAddress && (
              <p>
                <span className="text-gray-500">Address:</span>
                <span className="ml-2">{order.customerAddress}</span>
              </p>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Order Items</h2>
          <div className="divide-y">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex justify-between">
                <div>
                  <span className="font-medium">{item.itemName}</span>
                  <span className="text-gray-500 ml-2">
                    x{item.quantity}
                    {item.guestCount && ` (${item.guestCount} guests)`}
                  </span>
                  {item.notes && (
                    <p className="text-sm text-gray-500 mt-1">Note: {item.notes}</p>
                  )}
                </div>
                <span>{formatCurrency(Number(item.lineTotal))}</span>
              </div>
            ))}
          </div>

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
            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(Number(order.total))}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            * Prices do not include taxes. Final amount will be confirmed by the restaurant.
          </p>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-2">Order Notes</h2>
            <p className="text-gray-700">{order.notes}</p>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-amber-800 mb-2">What&apos;s Next?</h2>
          <ul className="text-amber-700 space-y-2 text-sm">
            <li>• We&apos;ll review your order and confirm availability</li>
            <li>• You&apos;ll receive a confirmation call or email</li>
            <li>• Payment will be collected upon {order.fulfillmentType}</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/"
              className="inline-block bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              Back to Menu
            </Link>
            <Link
              href={`/track?id=${order.id.slice(0, 8)}`}
              className="inline-block bg-white text-primary border-2 border-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Track Order
            </Link>
          </div>
          <p className="text-gray-500 text-sm">
            Questions? Contact us at the restaurant.
          </p>
        </div>
      </main>
    </div>
  )
}

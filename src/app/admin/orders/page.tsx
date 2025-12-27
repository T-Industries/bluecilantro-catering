import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatCurrency, formatDate } from '@/lib/utils'

async function getOrders(status?: string) {
  const where = status && status !== 'all' ? { status } : {}
  return prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const session = await getSession()
  if (!session) {
    redirect('/admin/login')
  }

  const status = searchParams.status || 'all'
  const orders = await getOrders(status)

  const statusCounts = await prisma.order.groupBy({
    by: ['status'],
    _count: true,
  })

  const counts = {
    all: statusCounts.reduce((sum, s) => sum + s._count, 0),
    new: statusCounts.find((s) => s.status === 'new')?._count || 0,
    confirmed: statusCounts.find((s) => s.status === 'confirmed')?._count || 0,
    completed: statusCounts.find((s) => s.status === 'completed')?._count || 0,
    cancelled: statusCounts.find((s) => s.status === 'cancelled')?._count || 0,
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-gray-600">Manage catering orders</p>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: 'All' },
          { key: 'new', label: 'New' },
          { key: 'confirmed', label: 'Confirmed' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map((filter) => (
          <Link
            key={filter.key}
            href={`/admin/orders?status=${filter.key}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              status === filter.key
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border'
            }`}
          >
            {filter.label} ({counts[filter.key as keyof typeof counts]})
          </Link>
        ))}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Order</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Scheduled</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">#{order.id.slice(0, 8)}</div>
                      <div className="text-xs text-gray-500">{formatDate(order.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{order.customerName}</div>
                      <div className="text-xs text-gray-500">{order.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          order.fulfillmentType === 'delivery'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {order.fulfillmentType.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{formatDate(order.scheduledDate)}</div>
                      <div className="text-xs text-gray-500">{order.scheduledTime}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{formatCurrency(Number(order.total))}</div>
                      <div className="text-xs text-gray-500">{order.items.length} items</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${styles[status] || 'bg-gray-100'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

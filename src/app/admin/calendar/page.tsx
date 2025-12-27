'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface Order {
  id: string
  status: string
  customerName: string
  customerPhone: string
  fulfillmentType: string
  scheduledDate: string
  scheduledTime: string
  total: string
  items: { id: string }[]
}

export default function AdminCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [currentDate])

  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/orders')
      const data = await response.json()
      setOrders(data)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (number | null)[] = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }

    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  const getOrdersForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return orders.filter((order) => order.scheduledDate.startsWith(dateStr))
  }

  const formatDateStr = (day: number) => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    setSelectedDate(null)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    setSelectedDate(null)
  }

  const days = getDaysInMonth(currentDate)
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  const selectedOrders = selectedDate
    ? orders.filter((order) => order.scheduledDate.startsWith(selectedDate))
    : []

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Order Calendar</h1>
        <p className="text-gray-600">View orders by date</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="px-3 py-1 hover:bg-gray-100 rounded"
            >
              ← Prev
            </button>
            <h2 className="text-lg font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={nextMonth}
              className="px-3 py-1 hover:bg-gray-100 rounded"
            >
              Next →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}

            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="p-2" />
              }

              const dateOrders = getOrdersForDate(day)
              const dateStr = formatDateStr(day)
              const isSelected = selectedDate === dateStr
              const isToday =
                new Date().toDateString() ===
                new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`p-2 min-h-[60px] border rounded-lg text-left transition-colors ${
                    isSelected
                      ? 'bg-primary text-white border-primary'
                      : isToday
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className={`text-sm font-medium ${isSelected ? '' : isToday ? 'text-blue-600' : ''}`}>
                    {day}
                  </div>
                  {dateOrders.length > 0 && (
                    <div className={`text-xs mt-1 ${isSelected ? 'text-white' : 'text-primary'}`}>
                      {dateOrders.length} order{dateOrders.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Date Orders */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">
            {selectedDate
              ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-CA', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Select a date'}
          </h2>

          {!selectedDate ? (
            <p className="text-gray-500 text-sm">Click on a date to view orders</p>
          ) : selectedOrders.length === 0 ? (
            <p className="text-gray-500 text-sm">No orders scheduled for this date</p>
          ) : (
            <div className="space-y-3">
              {selectedOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.scheduledTime}</div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      order.fulfillmentType === 'delivery'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {order.fulfillmentType.toUpperCase()}
                    </span>
                    <span className="font-medium">{formatCurrency(parseFloat(order.total))}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
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
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${styles[status] || 'bg-gray-100'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

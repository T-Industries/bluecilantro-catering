import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendOrderStatusUpdate } from '@/lib/email'
import { formatCurrency, formatDate } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Failed to fetch order:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    const validStatuses = ['new', 'confirmed', 'completed', 'cancelled']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get the current order to check if status is changing
    const currentOrder = await prisma.order.findUnique({
      where: { id: params.id },
    })

    const order = await prisma.order.update({
      where: { id: params.id },
      data: { status },
      include: { items: true },
    })

    // Send email notification if status changed to confirmed or cancelled
    if (currentOrder && currentOrder.status !== status && (status === 'confirmed' || status === 'cancelled')) {
      // Get business settings for email
      const settings = await prisma.setting.findMany({
        where: {
          key: {
            in: ['business_name', 'business_phone', 'business_address'],
          },
        },
      })
      const settingsMap = settings.reduce(
        (acc, s) => ({ ...acc, [s.key]: s.value }),
        {} as Record<string, string>
      )

      const orderEmailData = {
        orderId: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress || undefined,
        fulfillmentType: order.fulfillmentType,
        scheduledDate: formatDate(order.scheduledDate),
        scheduledTime: order.scheduledTime,
        items: order.items.map((item) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          guestCount: item.guestCount || undefined,
          lineTotal: formatCurrency(Number(item.lineTotal)),
          notes: item.notes || undefined,
        })),
        subtotal: formatCurrency(Number(order.subtotal)),
        deliveryFee: formatCurrency(Number(order.deliveryFee)),
        total: formatCurrency(Number(order.total)),
        notes: order.notes || undefined,
        businessName: settingsMap.business_name || 'BlueCilantro',
        businessPhone: settingsMap.business_phone || undefined,
        businessAddress: settingsMap.business_address || undefined,
      }

      await sendOrderStatusUpdate(orderEmailData, status as 'confirmed' | 'cancelled')
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Failed to update order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Soft delete - just update status to cancelled
    const order = await prisma.order.update({
      where: { id: params.id },
      data: { status: 'cancelled' },
      include: { items: true },
    })

    // Send cancellation email to customer
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['business_name', 'business_phone', 'business_address'],
        },
      },
    })
    const settingsMap = settings.reduce(
      (acc, s) => ({ ...acc, [s.key]: s.value }),
      {} as Record<string, string>
    )

    const orderEmailData = {
      orderId: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress || undefined,
      fulfillmentType: order.fulfillmentType,
      scheduledDate: formatDate(order.scheduledDate),
      scheduledTime: order.scheduledTime,
      items: order.items.map((item) => ({
        itemName: item.itemName,
        quantity: item.quantity,
        guestCount: item.guestCount || undefined,
        lineTotal: formatCurrency(Number(item.lineTotal)),
        notes: item.notes || undefined,
      })),
      subtotal: formatCurrency(Number(order.subtotal)),
      deliveryFee: formatCurrency(Number(order.deliveryFee)),
      total: formatCurrency(Number(order.total)),
      notes: order.notes || undefined,
      businessName: settingsMap.business_name || 'BlueCilantro',
      businessPhone: settingsMap.business_phone || undefined,
      businessAddress: settingsMap.business_address || undefined,
    }

    await sendOrderStatusUpdate(orderEmailData, 'cancelled')

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Failed to cancel order:', error)
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 })
  }
}

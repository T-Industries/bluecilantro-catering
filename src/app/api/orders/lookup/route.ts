import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('id')

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Support both full ID and partial ID (first 8 characters)
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { id: { startsWith: orderId } },
        ],
      },
      include: {
        items: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Return limited info for customer (no internal notes, etc.)
    return NextResponse.json({
      id: order.id,
      status: order.status,
      customerName: order.customerName,
      fulfillmentType: order.fulfillmentType,
      scheduledDate: order.scheduledDate,
      scheduledTime: order.scheduledTime,
      items: order.items.map((item) => ({
        itemName: item.itemName,
        quantity: item.quantity,
        guestCount: item.guestCount,
        lineTotal: item.lineTotal,
      })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      createdAt: order.createdAt,
    })
  } catch (error) {
    console.error('Failed to lookup order:', error)
    return NextResponse.json({ error: 'Failed to lookup order' }, { status: 500 })
  }
}

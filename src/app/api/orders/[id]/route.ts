import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendOrderStatusUpdate } from '@/lib/email'
import { formatCurrency, formatDate } from '@/lib/utils'
import { stripe } from '@/lib/stripe'

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

    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Handle payment capture/cancel when status changes
    let paymentStatus = currentOrder.paymentStatus
    let paidAt = currentOrder.paidAt

    // If confirming and payment is authorized, capture the payment
    if (status === 'confirmed' && currentOrder.status !== 'confirmed') {
      if (currentOrder.paymentStatus === 'authorized' && currentOrder.stripePaymentIntentId) {
        try {
          await stripe.paymentIntents.capture(currentOrder.stripePaymentIntentId)
          paymentStatus = 'paid'
          paidAt = new Date()
          console.log(`Payment captured for order ${params.id}`)
        } catch (stripeError) {
          console.error('Failed to capture payment:', stripeError)
          return NextResponse.json(
            { error: 'Failed to capture payment. Please try again.' },
            { status: 500 }
          )
        }
      }
    }

    // If cancelling and payment is authorized, cancel the authorization
    if (status === 'cancelled' && currentOrder.status !== 'cancelled') {
      if (currentOrder.paymentStatus === 'authorized' && currentOrder.stripePaymentIntentId) {
        try {
          await stripe.paymentIntents.cancel(currentOrder.stripePaymentIntentId)
          paymentStatus = 'cancelled'
          console.log(`Payment authorization cancelled for order ${params.id}`)
        } catch (stripeError) {
          console.error('Failed to cancel payment:', stripeError)
          // Don't block cancellation if payment cancel fails
        }
      }
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        status,
        paymentStatus,
        paidAt,
      },
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

    // Get current order to check payment status
    const currentOrder = await prisma.order.findUnique({
      where: { id: params.id },
    })

    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Cancel payment authorization if exists
    let paymentStatus = currentOrder.paymentStatus
    if (currentOrder.paymentStatus === 'authorized' && currentOrder.stripePaymentIntentId) {
      try {
        await stripe.paymentIntents.cancel(currentOrder.stripePaymentIntentId)
        paymentStatus = 'cancelled'
        console.log(`Payment authorization cancelled for order ${params.id}`)
      } catch (stripeError) {
        console.error('Failed to cancel payment:', stripeError)
        // Don't block cancellation if payment cancel fails
      }
    }

    // Soft delete - just update status to cancelled
    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: 'cancelled',
        paymentStatus,
      },
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

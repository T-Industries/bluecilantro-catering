import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { sendOrderNotification, sendCustomerOrderConfirmation } from '@/lib/email'
import { formatCurrency, formatDate } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        stripeSessionId: sessionId,
      },
      include: {
        items: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // If payment is still pending, check Stripe directly and process if needed
    // This is a fallback for when webhooks don't arrive (e.g., local dev without stripe listen)
    if (order.paymentStatus === 'pending') {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId)

        if (session.payment_status === 'paid' || session.status === 'complete') {
          // Get payment intent ID
          const paymentIntentId = typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id

          // Update order status
          const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'authorized',
              stripePaymentIntentId: paymentIntentId,
            },
            include: {
              items: true,
            },
          })

          console.log(`Order ${order.id} payment authorized via session check (webhook fallback)`)

          // Send emails
          await sendOrderEmails(updatedOrder)

          return NextResponse.json({
            id: updatedOrder.id,
            customerName: updatedOrder.customerName,
            customerEmail: updatedOrder.customerEmail,
            scheduledDate: updatedOrder.scheduledDate,
            scheduledTime: updatedOrder.scheduledTime,
            total: updatedOrder.total,
            paymentStatus: updatedOrder.paymentStatus,
          })
        }
      } catch (stripeError) {
        console.error('Failed to check Stripe session:', stripeError)
        // Continue with returning the order as-is
      }
    }

    return NextResponse.json({
      id: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      scheduledDate: order.scheduledDate,
      scheduledTime: order.scheduledTime,
      total: order.total,
      paymentStatus: order.paymentStatus,
    })
  } catch (error) {
    console.error('Failed to fetch order by session:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

// Helper function to send order emails
async function sendOrderEmails(order: {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string | null
  fulfillmentType: string
  scheduledDate: Date
  scheduledTime: string
  subtotal: unknown
  deliveryFee: unknown
  total: unknown
  notes: string | null
  items: Array<{
    itemName: string
    quantity: number
    guestCount: number | null
    lineTotal: unknown
    notes: string | null
  }>
}) {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['business_name', 'business_phone', 'business_address', 'notification_email', 'send_customer_emails'],
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

    // Send notification to restaurant
    const notificationEmail = settingsMap.notification_email || 'gpwc@bluecilantro.ca'
    await sendOrderNotification(notificationEmail, orderEmailData)

    // Send confirmation to customer (if enabled)
    if (settingsMap.send_customer_emails !== 'false') {
      await sendCustomerOrderConfirmation(orderEmailData)
    }

    console.log(`Order ${order.id} emails sent via session check fallback`)
  } catch (emailError) {
    console.error(`Failed to send order emails for ${order.id}:`, emailError)
  }
}

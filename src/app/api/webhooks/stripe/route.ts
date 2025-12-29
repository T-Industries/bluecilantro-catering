import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import { sendOrderNotification, sendCustomerOrderConfirmation } from '@/lib/email'
import { formatCurrency, formatDate } from '@/lib/utils'
import Stripe from 'stripe'

// Disable body parsing - we need the raw body for signature verification
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('Missing Stripe signature')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`Received Stripe webhook: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutExpired(session)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailed(paymentIntent)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId
  if (!orderId) {
    console.error('No orderId in session metadata')
    return
  }

  // Get the payment intent ID
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id

  // Update order with authorized status and fetch with items
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'authorized',
      stripePaymentIntentId: paymentIntentId,
    },
    include: {
      items: true,
    },
  })

  console.log(`Order ${orderId} payment authorized`)

  // Send order emails now that payment is authorized
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

    console.log(`Order ${orderId} emails sent`)
  } catch (emailError) {
    console.error(`Failed to send order emails for ${orderId}:`, emailError)
    // Don't throw - order is still valid even if email fails
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId
  if (!orderId) {
    console.error('No orderId in session metadata')
    return
  }

  // Check if order is still pending
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  })

  if (order && order.paymentStatus === 'pending') {
    // Mark as failed/expired
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'failed',
        status: 'cancelled',
      },
    })

    console.log(`Order ${orderId} checkout expired`)
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.orderId
  if (!orderId) {
    console.error('No orderId in payment intent metadata')
    return
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'failed',
    },
  })

  console.log(`Order ${orderId} payment failed`)
}

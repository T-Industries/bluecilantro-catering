import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { stripe, toCents } from '@/lib/stripe'
import { sendOrderNotification, sendCustomerOrderConfirmation } from '@/lib/email'
import { formatCurrency, formatDate } from '@/lib/utils'

interface OrderItemInput {
  menuItemId: string
  itemName: string
  itemPrice: number
  pricingType: string
  quantity: number
  guestCount: number | null
  notes: string | null
}

interface CheckoutInput {
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  scheduledDate: string
  scheduledTime: string
  notes: string | null
  promoCode?: string
  items: OrderItemInput[]
  subtotal: number
  deliveryFee: number
  total: number
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutInput = await request.json()

    // Validate required fields
    if (!body.customerName || !body.customerEmail || !body.customerPhone) {
      return NextResponse.json(
        { error: 'Customer information is required' },
        { status: 400 }
      )
    }

    if (!body.customerAddress) {
      return NextResponse.json(
        { error: 'Delivery address is required' },
        { status: 400 }
      )
    }

    if (!body.scheduledDate || !body.scheduledTime) {
      return NextResponse.json(
        { error: 'Scheduled date and time are required' },
        { status: 400 }
      )
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      )
    }

    // Check for valid bypass promo code
    const bypassCode = process.env.TEST_BYPASS_CODE
    const isValidBypass = bypassCode && body.promoCode && body.promoCode === bypassCode

    // If promo code provided but invalid, return error
    if (body.promoCode && !isValidBypass) {
      return NextResponse.json(
        { error: 'Invalid promo code' },
        { status: 400 }
      )
    }

    // Calculate line totals server-side (never trust client)
    const itemsWithTotals = body.items.map((item) => {
      const multiplier = item.pricingType === 'per_person' ? (item.guestCount || 1) : 1
      const lineTotal = item.itemPrice * item.quantity * multiplier
      return {
        menuItemId: item.menuItemId,
        itemName: item.itemName,
        itemPrice: item.itemPrice,
        pricingType: item.pricingType,
        quantity: item.quantity,
        guestCount: item.guestCount,
        lineTotal,
        notes: item.notes,
      }
    })

    // Recalculate totals server-side
    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.lineTotal, 0)
    const deliveryFee = body.deliveryFee
    const total = subtotal + deliveryFee

    // Create order in database
    const order = await prisma.order.create({
      data: {
        status: 'new',
        paymentStatus: isValidBypass ? 'test_bypass' : 'pending',
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        customerAddress: body.customerAddress,
        fulfillmentType: 'delivery',
        scheduledDate: new Date(body.scheduledDate),
        scheduledTime: body.scheduledTime,
        subtotal,
        deliveryFee,
        total,
        notes: body.notes,
        items: {
          create: itemsWithTotals,
        },
      },
      include: {
        items: true,
      },
    })

    // Send order emails (to restaurant and customer)
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

    // If bypass mode, skip Stripe and return success directly
    if (isValidBypass) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.json({
        success: true,
        orderId: order.id,
        bypassUrl: `${appUrl}/checkout/success?bypass=true&order_id=${order.id}`,
      })
    }

    // Build line items for Stripe Checkout
    const lineItems = itemsWithTotals.map((item) => {
      const unitAmount = toCents(item.itemPrice)
      const quantity = item.pricingType === 'per_person'
        ? item.quantity * (item.guestCount || 1)
        : item.quantity

      return {
        price_data: {
          currency: 'cad',
          product_data: {
            name: item.itemName,
            description: item.pricingType === 'per_person'
              ? `${item.guestCount} guests`
              : undefined,
          },
          unit_amount: unitAmount,
        },
        quantity,
      }
    })

    // Add delivery fee as a line item
    if (deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'Delivery Fee',
            description: undefined,
          },
          unit_amount: toCents(deliveryFee),
        },
        quantity: 1,
      })
    }

    // Get app URL for redirects
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create Stripe Checkout Session with manual capture
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: body.customerEmail,
      line_items: lineItems,
      payment_intent_data: {
        capture_method: 'manual', // Authorize only, capture later
        metadata: {
          orderId: order.id,
        },
      },
      metadata: {
        orderId: order.id,
      },
      automatic_tax: {
        enabled: true,
      },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancelled?order_id=${order.id}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
    })

    // Update order with Stripe session ID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripeSessionId: session.id,
      },
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      checkoutUrl: session.url,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

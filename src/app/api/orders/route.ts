import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
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

interface OrderInput {
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string | null
  fulfillmentType: 'delivery' | 'pickup'
  scheduledDate: string
  scheduledTime: string
  notes: string | null
  items: OrderItemInput[]
  subtotal: number
  deliveryFee: number
  total: number
}

export async function POST(request: NextRequest) {
  try {
    const body: OrderInput = await request.json()

    // Validate required fields
    if (!body.customerName || !body.customerEmail || !body.customerPhone) {
      return NextResponse.json({ error: 'Missing required customer information' }, { status: 400 })
    }

    if (!body.scheduledDate || !body.scheduledTime) {
      return NextResponse.json({ error: 'Please select a date and time' }, { status: 400 })
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    if (body.fulfillmentType === 'delivery' && !body.customerAddress) {
      return NextResponse.json({ error: 'Delivery address is required' }, { status: 400 })
    }

    // Calculate line totals
    const itemsWithTotals = body.items.map((item) => {
      const lineTotal =
        item.pricingType === 'per_person' && item.guestCount
          ? item.itemPrice * item.quantity * item.guestCount
          : item.itemPrice * item.quantity
      return { ...item, lineTotal }
    })

    // Create order in database
    const order = await prisma.order.create({
      data: {
        status: 'new',
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        customerAddress: body.customerAddress,
        fulfillmentType: body.fulfillmentType,
        scheduledDate: new Date(body.scheduledDate),
        scheduledTime: body.scheduledTime,
        subtotal: body.subtotal,
        deliveryFee: body.deliveryFee,
        total: body.total,
        notes: body.notes,
        items: {
          create: itemsWithTotals.map((item) => ({
            menuItemId: item.menuItemId,
            itemName: item.itemName,
            itemPrice: item.itemPrice,
            pricingType: item.pricingType,
            quantity: item.quantity,
            guestCount: item.guestCount,
            lineTotal: item.lineTotal,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    // Get settings for emails
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['notification_email', 'send_customer_confirmation', 'business_name', 'business_phone', 'business_address'],
        },
      },
    })
    const settingsMap = settings.reduce(
      (acc, s) => ({ ...acc, [s.key]: s.value }),
      {} as Record<string, string>
    )

    const notificationEmail = settingsMap.notification_email || 'gpwc@bluecilantro.ca'
    const sendCustomerEmail = settingsMap.send_customer_confirmation === 'true'

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
    await sendOrderNotification(notificationEmail, orderEmailData)

    // Send confirmation to customer (if enabled in settings)
    if (sendCustomerEmail) {
      await sendCustomerOrderConfirmation(orderEmailData)
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: 'Order placed successfully',
    })
  } catch (error) {
    console.error('Failed to create order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const date = searchParams.get('date')

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      where.scheduledDate = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

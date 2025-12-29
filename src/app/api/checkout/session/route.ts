import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        scheduledDate: true,
        scheduledTime: true,
        total: true,
        paymentStatus: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Failed to fetch order by session:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

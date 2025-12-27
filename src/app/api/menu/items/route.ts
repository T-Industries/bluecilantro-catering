import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const items = await prisma.menuItem.findMany({
      orderBy: { displayOrder: 'asc' },
      include: { category: true },
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error('Failed to fetch items:', error)
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.name || !body.price || !body.categoryId) {
      return NextResponse.json({ error: 'Name, price, and category are required' }, { status: 400 })
    }

    // Get max display order for this category
    const maxOrder = await prisma.menuItem.aggregate({
      where: { categoryId: body.categoryId },
      _max: { displayOrder: true },
    })

    const item = await prisma.menuItem.create({
      data: {
        categoryId: body.categoryId,
        name: body.name,
        description: body.description || null,
        price: body.price,
        pricingType: body.pricingType || 'fixed',
        servesCount: body.servesCount || null,
        imageUrl: body.imageUrl || null,
        displayOrder: (maxOrder._max.displayOrder || 0) + 1,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Failed to create item:', error)
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}

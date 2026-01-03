import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST /api/packages/[id]/items - Add item to quantity/fixed package
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Get max display order
    const maxOrder = await prisma.packageItem.aggregate({
      where: { packageId: params.id },
      _max: { displayOrder: true },
    })

    const item = await prisma.packageItem.create({
      data: {
        packageId: params.id,
        name: body.name,
        description: body.description || null,
        imageUrl: body.imageUrl || null,
        price: body.price || null,
        tierPrices: body.tierPrices || null,
        badge: body.badge || null,
        displayOrder: (maxOrder._max.displayOrder || 0) + 1,
      },
    })

    revalidatePath('/')
    return NextResponse.json(item)
  } catch (error) {
    console.error('Failed to create package item:', error)
    return NextResponse.json({ error: 'Failed to create package item' }, { status: 500 })
  }
}

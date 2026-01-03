import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// PUT /api/packages/[id]/items/[itemId] - Update a package item (quantity/fixed)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const item = await prisma.packageItem.update({
      where: { id: params.itemId },
      data: {
        name: body.name,
        description: body.description,
        imageUrl: body.imageUrl,
        price: body.price,
        tierPrices: body.tierPrices,
        badge: body.badge,
        active: body.active,
        displayOrder: body.displayOrder,
      },
    })

    revalidatePath('/')
    return NextResponse.json(item)
  } catch (error) {
    console.error('Failed to update package item:', error)
    return NextResponse.json({ error: 'Failed to update package item' }, { status: 500 })
  }
}

// DELETE /api/packages/[id]/items/[itemId] - Delete a package item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.packageItem.delete({
      where: { id: params.itemId },
    })

    revalidatePath('/')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete package item:', error)
    return NextResponse.json({ error: 'Failed to delete package item' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// PUT /api/packages/[id]/tiers/[tierId] - Update a tier
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; tierId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const tier = await prisma.packageTier.update({
      where: { id: params.tierId },
      data: {
        name: body.name,
        description: body.description,
        selectCount: body.selectCount,
        price: body.price,
        active: body.active,
        displayOrder: body.displayOrder,
      },
    })

    revalidatePath('/')
    return NextResponse.json(tier)
  } catch (error) {
    console.error('Failed to update tier:', error)
    return NextResponse.json({ error: 'Failed to update tier' }, { status: 500 })
  }
}

// DELETE /api/packages/[id]/tiers/[tierId] - Delete a tier
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; tierId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.packageTier.delete({
      where: { id: params.tierId },
    })

    revalidatePath('/')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete tier:', error)
    return NextResponse.json({ error: 'Failed to delete tier' }, { status: 500 })
  }
}

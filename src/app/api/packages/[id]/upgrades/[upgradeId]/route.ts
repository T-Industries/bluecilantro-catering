import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// PUT /api/packages/[id]/upgrades/[upgradeId] - Update an upgrade
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; upgradeId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const upgrade = await prisma.packageUpgrade.update({
      where: { id: params.upgradeId },
      data: {
        name: body.name,
        description: body.description,
        pricePerPerson: body.price,
        active: body.active,
        displayOrder: body.displayOrder,
      },
    })

    revalidatePath('/')
    return NextResponse.json(upgrade)
  } catch (error) {
    console.error('Failed to update upgrade:', error)
    return NextResponse.json({ error: 'Failed to update upgrade' }, { status: 500 })
  }
}

// DELETE /api/packages/[id]/upgrades/[upgradeId] - Delete an upgrade
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; upgradeId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.packageUpgrade.delete({
      where: { id: params.upgradeId },
    })

    revalidatePath('/')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete upgrade:', error)
    return NextResponse.json({ error: 'Failed to delete upgrade' }, { status: 500 })
  }
}

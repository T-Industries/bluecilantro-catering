import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST /api/packages/[id]/upgrades - Add an upgrade to a package
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

    if (body.price === undefined || body.price === null) {
      return NextResponse.json({ error: 'Price is required' }, { status: 400 })
    }

    // Get max display order for this package's upgrades
    const maxOrder = await prisma.packageUpgrade.aggregate({
      where: { packageId: params.id },
      _max: { displayOrder: true },
    })

    const upgrade = await prisma.packageUpgrade.create({
      data: {
        packageId: params.id,
        name: body.name,
        description: body.description || null,
        pricePerPerson: body.price,
        displayOrder: (maxOrder._max.displayOrder || 0) + 1,
      },
    })

    revalidatePath('/')
    return NextResponse.json(upgrade)
  } catch (error) {
    console.error('Failed to create upgrade:', error)
    return NextResponse.json({ error: 'Failed to create upgrade' }, { status: 500 })
  }
}

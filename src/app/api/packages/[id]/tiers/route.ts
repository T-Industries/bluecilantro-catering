import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST /api/packages/[id]/tiers - Add a tier to a package
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

    if (!body.name || body.price === undefined) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
    }

    // Get max display order for this package's tiers
    const maxOrder = await prisma.packageTier.aggregate({
      where: { packageId: params.id },
      _max: { displayOrder: true },
    })

    const tier = await prisma.packageTier.create({
      data: {
        packageId: params.id,
        name: body.name,
        description: body.description || null,
        selectCount: body.selectCount || null,
        price: body.price,
        displayOrder: (maxOrder._max.displayOrder || 0) + 1,
      },
    })

    revalidatePath('/')
    return NextResponse.json(tier)
  } catch (error) {
    console.error('Failed to create tier:', error)
    return NextResponse.json({ error: 'Failed to create tier' }, { status: 500 })
  }
}

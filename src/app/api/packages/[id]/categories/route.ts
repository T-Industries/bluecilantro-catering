import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST /api/packages/[id]/categories - Add a category to a selection package
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

    // Get max display order for this package's categories
    const maxOrder = await prisma.packageCategory.aggregate({
      where: { packageId: params.id },
      _max: { displayOrder: true },
    })

    const category = await prisma.packageCategory.create({
      data: {
        packageId: params.id,
        name: body.name,
        description: body.description || null,
        imageUrl: body.imageUrl || null,
        displayOrder: (maxOrder._max.displayOrder || 0) + 1,
      },
      include: {
        items: true,
      },
    })

    revalidatePath('/')
    return NextResponse.json(category)
  } catch (error) {
    console.error('Failed to create category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

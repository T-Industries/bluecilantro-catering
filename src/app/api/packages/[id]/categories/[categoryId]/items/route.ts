import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST /api/packages/[id]/categories/[categoryId]/items - Add item to category
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
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
    const maxOrder = await prisma.packageCategoryItem.aggregate({
      where: { categoryId: params.categoryId },
      _max: { displayOrder: true },
    })

    const item = await prisma.packageCategoryItem.create({
      data: {
        categoryId: params.categoryId,
        name: body.name,
        description: body.description || null,
        displayOrder: (maxOrder._max.displayOrder || 0) + 1,
      },
    })

    revalidatePath('/')
    return NextResponse.json(item)
  } catch (error) {
    console.error('Failed to create category item:', error)
    return NextResponse.json({ error: 'Failed to create category item' }, { status: 500 })
  }
}

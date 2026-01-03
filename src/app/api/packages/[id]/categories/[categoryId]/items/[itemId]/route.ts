import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// PUT /api/packages/[id]/categories/[categoryId]/items/[itemId] - Update category item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string; itemId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const item = await prisma.packageCategoryItem.update({
      where: { id: params.itemId },
      data: {
        name: body.name,
        description: body.description,
        active: body.active,
        displayOrder: body.displayOrder,
      },
    })

    revalidatePath('/')
    return NextResponse.json(item)
  } catch (error) {
    console.error('Failed to update category item:', error)
    return NextResponse.json({ error: 'Failed to update category item' }, { status: 500 })
  }
}

// DELETE /api/packages/[id]/categories/[categoryId]/items/[itemId] - Delete category item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string; itemId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.packageCategoryItem.delete({
      where: { id: params.itemId },
    })

    revalidatePath('/')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete category item:', error)
    return NextResponse.json({ error: 'Failed to delete category item' }, { status: 500 })
  }
}

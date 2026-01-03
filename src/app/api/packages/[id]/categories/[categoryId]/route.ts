import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// PUT /api/packages/[id]/categories/[categoryId] - Update a category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const category = await prisma.packageCategory.update({
      where: { id: params.categoryId },
      data: {
        name: body.name,
        description: body.description,
        imageUrl: body.imageUrl,
        active: body.active,
        displayOrder: body.displayOrder,
      },
      include: {
        items: true,
      },
    })

    revalidatePath('/')
    return NextResponse.json(category)
  } catch (error) {
    console.error('Failed to update category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// DELETE /api/packages/[id]/categories/[categoryId] - Delete a category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.packageCategory.delete({
      where: { id: params.categoryId },
    })

    revalidatePath('/')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}

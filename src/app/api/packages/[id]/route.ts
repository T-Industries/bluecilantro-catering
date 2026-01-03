import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/packages/[id] - Get a single package with all related data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pkg = await prisma.menuPackage.findUnique({
      where: { id: params.id },
      include: {
        tiers: { orderBy: { displayOrder: 'asc' } },
        categories: {
          orderBy: { displayOrder: 'asc' },
          include: {
            items: { orderBy: { displayOrder: 'asc' } },
          },
        },
        items: { orderBy: { displayOrder: 'asc' } },
        upgrades: { orderBy: { displayOrder: 'asc' } },
      },
    })

    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    return NextResponse.json(pkg)
  } catch (error) {
    console.error('Failed to fetch package:', error)
    return NextResponse.json({ error: 'Failed to fetch package' }, { status: 500 })
  }
}

// PUT /api/packages/[id] - Update a package
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const pkg = await prisma.menuPackage.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        type: body.type,
        imageUrl: body.imageUrl,
        badge: body.badge,
        minGuests: body.minGuests,
        active: body.active,
        displayOrder: body.displayOrder,
      },
      include: {
        tiers: { orderBy: { displayOrder: 'asc' } },
        categories: {
          orderBy: { displayOrder: 'asc' },
          include: {
            items: { orderBy: { displayOrder: 'asc' } },
          },
        },
        items: { orderBy: { displayOrder: 'asc' } },
        upgrades: { orderBy: { displayOrder: 'asc' } },
      },
    })

    revalidatePath('/')
    return NextResponse.json(pkg)
  } catch (error) {
    console.error('Failed to update package:', error)
    return NextResponse.json({ error: 'Failed to update package' }, { status: 500 })
  }
}

// DELETE /api/packages/[id] - Delete a package
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.menuPackage.delete({
      where: { id: params.id },
    })

    revalidatePath('/')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete package:', error)
    return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 })
  }
}

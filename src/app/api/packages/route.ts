import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/packages - List all packages (public for customer, includes all data for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const packages = await prisma.menuPackage.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { displayOrder: 'asc' },
      include: {
        tiers: {
          where: activeOnly ? { active: true } : undefined,
          orderBy: { displayOrder: 'asc' },
        },
        categories: {
          where: activeOnly ? { active: true } : undefined,
          orderBy: { displayOrder: 'asc' },
          include: {
            items: {
              where: activeOnly ? { active: true } : undefined,
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
        items: {
          where: activeOnly ? { active: true } : undefined,
          orderBy: { displayOrder: 'asc' },
        },
        upgrades: {
          where: activeOnly ? { active: true } : undefined,
          orderBy: { displayOrder: 'asc' },
        },
      },
    })

    return NextResponse.json(packages)
  } catch (error) {
    console.error('Failed to fetch packages:', error)
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
}

// POST /api/packages - Create a new package (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.name || !body.type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 })
    }

    if (!['selection', 'quantity', 'fixed'].includes(body.type)) {
      return NextResponse.json({ error: 'Invalid package type' }, { status: 400 })
    }

    // Get max display order
    const maxOrder = await prisma.menuPackage.aggregate({
      _max: { displayOrder: true },
    })

    const pkg = await prisma.menuPackage.create({
      data: {
        name: body.name,
        description: body.description || null,
        type: body.type,
        imageUrl: body.imageUrl || null,
        badge: body.badge || null,
        minGuests: body.minGuests || null,
        displayOrder: (maxOrder._max.displayOrder || 0) + 1,
      },
      include: {
        tiers: true,
        categories: { include: { items: true } },
        items: true,
        upgrades: true,
      },
    })

    revalidatePath('/')
    return NextResponse.json(pkg)
  } catch (error) {
    console.error('Failed to create package:', error)
    return NextResponse.json({ error: 'Failed to create package' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!admin) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({ requiresPasswordSetup: false })
    }

    // Check if password needs to be set
    if (admin.mustSetPassword || !admin.passwordHash) {
      return NextResponse.json({ requiresPasswordSetup: true, email: admin.email })
    }

    return NextResponse.json({ requiresPasswordSetup: false })
  } catch (error) {
    console.error('Check email error:', error)
    return NextResponse.json({ error: 'Check failed' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, confirmPassword } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    if (!admin.mustSetPassword && admin.passwordHash) {
      return NextResponse.json({ error: 'Password already set. Please login.' }, { status: 400 })
    }

    // Hash and save password
    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        passwordHash,
        mustSetPassword: false,
      },
    })

    // Create session
    await createSession(admin.id, admin.email)

    return NextResponse.json({
      success: true,
      message: 'Password set successfully'
    })
  } catch (error) {
    console.error('Password setup error:', error)
    return NextResponse.json({ error: 'Failed to set password' }, { status: 500 })
  }
}

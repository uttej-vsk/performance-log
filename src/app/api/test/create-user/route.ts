import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const email = 'test@example.com'
    const name = 'Test User'
    const password = 'password123'

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        message: 'User already exists' 
      })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Test user created successfully',
      user: { id: user.id, email: user.email, name: user.name }
    })
  } catch (error) {
    console.error('Error creating test user:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create test user' 
    }, { status: 500 })
  }
} 
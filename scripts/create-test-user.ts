import { prisma } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  // Change these values as needed
  const email = 'test@example.com'
  const name = 'Test User'
  const password = 'password123'

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

  console.log('Test user created:', user)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 
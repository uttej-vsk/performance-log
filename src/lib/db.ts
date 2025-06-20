import { PrismaClient } from '@prisma/client'

// Create a single Prisma client instance for the app
export const prisma = new PrismaClient()

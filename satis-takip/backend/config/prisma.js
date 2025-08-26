import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Connection test function
export const connectPrismaDB = async () => {
  try {
    await prisma.$connect()
    console.log('PostgreSQL connected with Prisma')
  } catch (error) {
    console.error('PostgreSQL connection error:', error)
    process.exit(1)
  }
}

// Disconnect function
export const disconnectPrismaDB = async () => {
  await prisma.$disconnect()
}
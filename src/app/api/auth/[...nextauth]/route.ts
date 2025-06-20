import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// NextAuth API route handler for authentication
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

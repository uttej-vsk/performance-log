# Authentication, Routing & Caching Documentation

## Authentication Implementation

### NextAuth.js Configuration
```typescript
// lib/auth.ts
import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import { compare } from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
  },
  events: {
    async signIn({ user, account, profile }) {
      // Log sign-in activity
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "login",
          metadata: {
            provider: account?.provider,
            userAgent: "N/A" // Would come from request headers
          }
        }
      })
    }
  }
}
```

### Authentication Middleware
```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Add custom logic here if needed
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is authenticated for protected routes
        const { pathname } = req.nextUrl
        
        // Public routes
        if (pathname.startsWith("/auth") || pathname === "/") {
          return true
        }
        
        // Protected routes require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    // Match all paths except public ones
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ]
}
```

### Server-Side Authentication Utilities
```typescript
// lib/auth-utils.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/signin")
  }
  return user
}

// API route authentication helper
export async function getAuthenticatedUser(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  
  return session.user
}
```

### Client-Side Authentication Hooks
```typescript
// hooks/use-auth.ts
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function useAuth(redirectTo?: string) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session && redirectTo) {
      router.push(redirectTo)
    }
  }, [session, status, router, redirectTo])

  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: !!session,
  }
}

export function useRequireAuth() {
  return useAuth("/auth/signin")
}
```

## Routing Structure

### App Router Structure
```
src/app/
├── (auth)/                    # Route group for auth pages
│   ├── layout.tsx            # Auth layout (no sidebar)
│   ├── signin/
│   │   └── page.tsx         # Sign in page
│   ├── signup/
│   │   └── page.tsx         # Sign up page
│   └── error/
│       └── page.tsx         # Auth error page
├── (dashboard)/              # Route group for main app
│   ├── layout.tsx           # Dashboard layout (with sidebar)
│   ├── page.tsx             # Dashboard home
│   ├── chat/
│   │   ├── page.tsx         # Chat interface
│   │   └── [id]/
│   │       └── page.tsx     # Specific conversation
│   ├── timeline/
│   │   └── page.tsx         # Work entries timeline
│   ├── analytics/
│   │   └── page.tsx         # Personal analytics
│   └── review/
│       ├── page.tsx         # Review list
│       ├── generate/
│       │   └── page.tsx     # Generate new review
│       └── [id]/
│           └── page.tsx     # View specific review
├── api/                      # API routes
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts     # NextAuth handler
│   ├── chat/
│   │   ├── conversations/
│   │   │   └── route.ts
│   │   ├── messages/
│   │   │   └── route.ts
│   │   └── stream/
│   │       └── route.ts
│   ├── work-entries/
│   │   ├── route.ts
│   │   └── [id]/
│   │       └── route.ts
│   └── reviews/
│       ├── route.ts
│       └── generate/
│           └── route.ts
├── globals.css               # Global styles
├── layout.tsx                # Root layout
├── loading.tsx               # Global loading UI
├── error.tsx                 # Global error UI
└── not-found.tsx             # 404 page
```

### Route Protection
```typescript
// app/(dashboard)/layout.tsx
import { requireAuth } from "@/lib/auth-utils"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ensure user is authenticated
  await requireAuth()

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### Dynamic Routes
```typescript
// app/(dashboard)/chat/[id]/page.tsx
interface ChatPageProps {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const user = await requireAuth()
  
  // Validate conversation belongs to user
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: params.id,
      userId: user.id
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!conversation) {
    notFound()
  }

  return <ChatInterface conversation={conversation} />
}
```

### Navigation Component
```typescript
// components/layout/navigation.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Dashboard", icon: "Home" },
  { href: "/chat", label: "Chat", icon: "MessageCircle" },
  { href: "/timeline", label: "Timeline", icon: "Clock" },
  { href: "/analytics", label: "Analytics", icon: "BarChart" },
  { href: "/review", label: "Reviews", icon: "FileText" },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="space-y-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
            pathname === item.href
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
```

## Caching Strategy

### Next.js Caching Configuration
```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  // Enable static optimization for certain pages
  async headers() {
    return [
      {
        source: '/api/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### Server Component Caching
```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/db'

// Cache user's work entries
export const getCachedWorkEntries = unstable_cache(
  async (userId: string, limit: number = 10) => {
    return await prisma.workEntry.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    })
  },
  ['work-entries'],
  {
    revalidate: 300, // 5 minutes
    tags: ['work-entries']
  }
)

// Cache user statistics
export const getCachedUserStats = unstable_cache(
  async (userId: string) => {
    const [totalEntries, totalImpactScore, tagCounts] = await Promise.all([
      prisma.workEntry.count({
        where: { userId, deletedAt: null }
      }),
      prisma.workEntry.aggregate({
        where: { userId, deletedAt: null },
        _sum: { impactScore: true }
      }),
      prisma.workEntryTag.groupBy({
        by: ['tagId'],
        where: {
          workEntry: { userId, deletedAt: null }
        },
        _count: true
      })
    ])

    return {
      totalEntries,
      totalImpactScore: totalImpactScore._sum.impactScore || 0,
      tagCounts
    }
  },
  ['user-stats'],
  {
    revalidate: 600, // 10 minutes
    tags: ['user-stats']
  }
)
```

### API Route Caching
```typescript
// app/api/work-entries/route.ts
import { NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { getCachedWorkEntries } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Use cached data
    const workEntries = await getCachedWorkEntries(user.id, limit)

    // Set cache headers
    return Response.json(
      { success: true, data: workEntries },
      {
        headers: {
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=600'
        }
      }
    )
  } catch (error) {
    return Response.json(
      { success: false, error: 'Failed to fetch work entries' },
      { status: 500 }
    )
  }
}
```

### Client-Side Caching with React Query
```typescript
// lib/react-query.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Query keys factory
export const queryKeys = {
  workEntries: {
    all: ['work-entries'] as const,
    lists: () => [...queryKeys.workEntries.all, 'list'] as const,
    list: (filters: Record<string, any>) => 
      [...queryKeys.workEntries.lists(), { filters }] as const,
    details: () => [...queryKeys.workEntries.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.workEntries.details(), id] as const,
  },
  conversations: {
    all: ['conversations'] as const,
    lists: () => [...queryKeys.conversations.all, 'list'] as const,
    list: (filters: Record<string, any>) => 
      [...queryKeys.conversations.lists(), { filters }] as const,
    details: () => [...queryKeys.conversations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.conversations.details(), id] as const,
    messages: (id: string) => [...queryKeys.conversations.detail(id), 'messages'] as const,
  },
  reviews: {
    all: ['reviews'] as const,
    lists: () => [...queryKeys.reviews.all, 'list'] as const,
    list: (filters: Record<string, any>) => 
      [...queryKeys.reviews.lists(), { filters }] as const,
    details: () => [...queryKeys.reviews.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.reviews.details(), id] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    dashboard: (period: string) => [...queryKeys.analytics.all, 'dashboard', period] as const,
    userStats: () => [...queryKeys.analytics.all, 'user-stats'] as const,
  }
}
```

### Custom Hooks with Caching
```typescript
// hooks/use-work-entries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'

interface WorkEntriesFilters {
  search?: string
  tags?: string[]
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export function useWorkEntries(filters: WorkEntriesFilters = {}) {
  return useQuery({
    queryKey: queryKeys.workEntries.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v))
          } else {
            params.append(key, String(value))
          }
        }
      })

      const response = await fetch(`/api/work-entries?${params}`)
      if (!response.ok) throw new Error('Failed to fetch work entries')
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useWorkEntry(id: string) {
  return useQuery({
    queryKey: queryKeys.workEntries.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/work-entries/${id}`)
      if (!response.ok) throw new Error('Failed to fetch work entry')
      return response.json()
    },
    enabled: !!id,
  })
}

export function useCreateWorkEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateWorkEntryRequest) => {
      const response = await fetch('/api/work-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create work entry')
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch work entries
      queryClient.invalidateQueries({ queryKey: queryKeys.workEntries.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all })
    },
  })
}

export function useUpdateWorkEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateWorkEntryRequest }) => {
      const response = await fetch(`/api/work-entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update work entry')
      return response.json()
    },
    onSuccess: (data, variables) => {
      // Update specific work entry in cache
      queryClient.setQueryData(
        queryKeys.workEntries.detail(variables.id),
        data
      )
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.workEntries.lists() })
    },
  })
}
```

### Cache Invalidation Strategy
```typescript
// lib/cache-invalidation.ts
import { revalidateTag } from 'next/cache'
import { queryClient } from '@/lib/react-query'

export async function invalidateWorkEntriesCache(userId: string) {
  // Server-side cache invalidation
  revalidateTag('work-entries')
  revalidateTag('user-stats')
  
  // Client-side cache invalidation
  if (typeof window !== 'undefined') {
    queryClient.invalidateQueries({ queryKey: queryKeys.workEntries.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all })
  }
}

export async function invalidateConversationCache(conversationId: string) {
  revalidateTag('conversations')
  
  if (typeof window !== 'undefined') {
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.conversations.detail(conversationId) 
    })
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.conversations.messages(conversationId) 
    })
  }
}

// Usage in API routes
// app/api/work-entries/route.ts
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    const data = await request.json()
    
    const workEntry = await prisma.workEntry.create({
      data: {
        ...data,
        userId: user.id
      }
    })

    // Invalidate caches
    await invalidateWorkEntriesCache(user.id)

    return Response.json({ success: true, data: workEntry })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
```

### Redis Caching for Session Data
```typescript
// lib/redis.ts
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Session caching
export async function cacheUserSession(userId: string, sessionData: any) {
  await redis.setex(`session:${userId}`, 3600, JSON.stringify(sessionData)) // 1 hour
}

export async function getCachedUserSession(userId: string) {
  const cached = await redis.get(`session:${userId}`)
  return cached ? JSON.parse(cached as string) : null
}

// AI response caching
export async function cacheAIResponse(prompt: string, response: string) {
  const key = `ai:${Buffer.from(prompt).toString('base64').slice(0, 50)}`
  await redis.setex(key, 86400, response) // 24 hours
}

export async function getCachedAIResponse(prompt: string) {
  const key = `ai:${Buffer.from(prompt).toString('base64').slice(0, 50)}`
  return await redis.get(key)
}

// Rate limiting cache
export async function checkRateLimit(userId: string, action: string, limit: number, window: number) {
  const key = `rate:${userId}:${action}`
  const current = await redis.incr(key)
  
  if (current === 1) {
    await redis.expire(key, window)
  }
  
  return current <= limit
}
```

### Database Query Optimization
```typescript
// lib/db-optimizations.ts
import { prisma } from '@/lib/db'

// Optimized work entries query with proper indexing
export async function getOptimizedWorkEntries(
  userId: string, 
  filters: WorkEntriesFilters
) {
  const where = {
    userId,
    deletedAt: null,
    ...(filters.search && {
      OR: [
        { title: { contains: filters.search, mode: 'insensitive' as const } },
        { description: { contains: filters.search, mode: 'insensitive' as const } }
      ]
    }),
    ...(filters.tags?.length && {
      tags: {
        some: {
          tag: {
            name: { in: filters.tags }
          }
        }
      }
    }),
    ...(filters.dateFrom && {
      workDate: { gte: new Date(filters.dateFrom) }
    }),
    ...(filters.dateTo && {
      workDate: { lte: new Date(filters.dateTo) }
    })
  }

  const [entries, total] = await Promise.all([
    prisma.workEntry.findMany({
      where,
      orderBy: { workDate: 'desc' },
      skip: ((filters.page || 1) - 1) * (filters.limit || 10),
      take: filters.limit || 10,
      include: {
        tags: {
          include: {
            tag: {
              select: { id: true, name: true, color: true }
            }
          }
        }
      }
    }),
    prisma.workEntry.count({ where })
  ])

  return {
    entries,
    pagination: {
      page: filters.page || 1,
      limit: filters.limit || 10,
      total,
      pages: Math.ceil(total / (filters.limit || 10))
    }
  }
}

// Bulk operations for better performance
export async function bulkCreateWorkEntries(userId: string, entries: any[]) {
  return await prisma.$transaction(
    entries.map(entry => 
      prisma.workEntry.create({
        data: { ...entry, userId }
      })
    )
  )
}
```

### Performance Monitoring
```typescript
// lib/performance.ts
export function withPerformanceLogging<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  name: string
) {
  return async (...args: T): Promise<R> => {
    const start = performance.now()
    
    try {
      const result = await fn(...args)
      const duration = performance.now() - start
      
      console.log(`[${name}] Execution time: ${duration.toFixed(2)}ms`)
      
      // Log to analytics service in production
      if (process.env.NODE_ENV === 'production') {
        // Send metrics to monitoring service
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      console.error(`[${name}] Failed after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  }
}

// Usage
export const getWorkEntriesWithLogging = withPerformanceLogging(
  getOptimizedWorkEntries,
  'getWorkEntries'
)
```

### Cache Configuration Summary
```typescript
// Cache layers and TTL configuration
export const CACHE_CONFIG = {
  // Server-side caching (Next.js unstable_cache)
  serverCache: {
    workEntries: 300,      // 5 minutes
    userStats: 600,        // 10 minutes
    conversations: 180,    // 3 minutes
  },
  
  // Client-side caching (React Query)
  clientCache: {
    staleTime: 5 * 60 * 1000,    // 5 minutes
    cacheTime: 10 * 60 * 1000,   // 10 minutes
  },
  
  // Redis caching
  redisCache: {
    sessions: 3600,        // 1 hour
    aiResponses: 86400,    // 24 hours
    rateLimit: 3600,       // 1 hour
  },
  
  // HTTP cache headers
  httpCache: {
    static: 'public, max-age=3600, stale-while-revalidate=86400',
    api: 'private, max-age=300, stale-while-revalidate=600',
    dynamic: 'no-cache, no-store, must-revalidate'
  }
} as const
```
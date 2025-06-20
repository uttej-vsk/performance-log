# Tech Stack & Security Documentation

## Technology Stack

### Frontend Stack
```typescript
// Core Framework
Next.js (latest)               // React framework with App Router
React (latest)                 // UI library
TypeScript (latest)            // Type safety

// Styling & UI
Tailwind CSS (latest)          // Utility-first CSS framework
shadcn/ui (latest)             // Reusable component library
Lucide React (latest)          // Icon library
next-themes (latest)           // Dark mode support

// State Management
React Query (latest)           // Server state management
Zustand (latest)               // Client state management (if needed)
React Hook Form (latest)       // Form state management

// Validation & Utilities
Zod (latest)                   // Runtime type validation
date-fns (latest)              // Date manipulation
clsx (latest)                  // Class name utility
```

### Backend Stack
```typescript
// Runtime & Framework
Next.js API Routes (latest)    // Serverless API endpoints
Node.js (latest LTS)           // JavaScript runtime

// Database & ORM
PostgreSQL (latest)            // Primary database
Prisma (latest)                // Database ORM and migrations
@prisma/client (latest)        // Database client

// Authentication
NextAuth.js (latest)           // Authentication framework
@auth/prisma-adapter (latest)  // Database adapter for NextAuth

// AI & ML
OpenAI API (latest)            // Primary AI service
LangChain.js (latest)          // AI application framework
tiktoken (latest)              // Token counting for AI
```

### Development & Deployment
```typescript
// Development Tools
ESLint (latest)                // Code linting
Prettier (latest)              // Code formatting
TypeScript ESLint (latest)     // TypeScript-specific linting
Husky (latest)                 // Git hooks

// Testing
Jest (latest)                  // Testing framework
React Testing Library (latest) // Component testing
Playwright (latest)            // E2E testing

// Deployment & Hosting
Vercel (latest)                // Frontend and API hosting
Neon/PlanetScale (latest)      // Managed PostgreSQL
Vercel Analytics (latest)      // Web analytics
```

### External Services
```typescript
// AI Services
OpenAI API (latest)           // Primary AI model
OpenAI Embeddings (latest)    // Text embeddings for search

// Communication
Resend (latest)               // Email service
Pusher/Ably (latest)         // Real-time (if needed beyond SSE)

// Monitoring & Analytics
Sentry (latest)               // Error tracking
PostHog (latest)              // Product analytics
Vercel Analytics (latest)     // Web performance
```

## Package.json Dependencies

### Core Dependencies
```json
{
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "typescript": "latest",
    "@prisma/client": "latest",
    "prisma": "latest",
    "next-auth": "latest",
    "@auth/prisma-adapter": "latest",
    "zod": "latest",
    "react-hook-form": "latest",
    "@hookform/resolvers": "latest",
    "@tanstack/react-query": "latest",
    "openai": "latest",
    "langchain": "latest",
    "tailwindcss": "latest",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-dropdown-menu": "latest",
    "@radix-ui/react-slot": "latest",
    "lucide-react": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "date-fns": "latest",
    "next-themes": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "eslint": "latest",
    "eslint-config-next": "latest",
    "@typescript-eslint/eslint-plugin": "latest",
    "@typescript-eslint/parser": "latest",
    "prettier": "latest",
    "prettier-plugin-tailwindcss": "latest",
    "@testing-library/react": "latest",
    "@testing-library/jest-dom": "latest",
    "jest": "latest",
    "jest-environment-jsdom": "latest",
    "playwright": "latest"
  }
}
```

## Security & Privacy

### Authentication Security
```typescript
// NextAuth.js Configuration
export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      // Email/password authentication
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Implement secure password verification
        return await verifyUser(credentials)
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  callbacks: {
    async session({ session, token }) {
      // Add user ID to session
      session.user.id = token.sub
      return session
    }
  }
})
```

### Data Protection
```typescript
// Input Validation Schema
import { z } from 'zod'

export const WorkEntrySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  impact: z.string().optional(),
  metrics: z.array(z.string()).optional(),
  tags: z.array(z.string()).max(10),
  isPublic: z.boolean().default(false)
})

// Sanitization Function
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeContent(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  })
}
```

### API Security
```typescript
// Rate Limiting Middleware
import { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export async function withRateLimit(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<Response>
) {
  const ip = request.ip ?? '127.0.0.1'
  const { success } = await ratelimit.limit(ip)
  
  if (!success) {
    return new Response('Too many requests', { status: 429 })
  }
  
  return handler(request)
}

// CORS Configuration
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
      ? 'https://yourapp.com' 
      : 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}
```

### Database Security
```prisma
// Prisma Schema with Security Considerations
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String?
  image       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Soft delete instead of hard delete
  deletedAt   DateTime?
  
  // Relationships
  workEntries WorkEntry[]
  conversations Conversation[]
  
  @@map("users")
}

model WorkEntry {
  id          String   @id @default(cuid())
  userId      String
  title       String
  description String   @db.Text
  
  // Encrypted sensitive data
  encryptedMetrics Json?
  
  // Audit trail
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  
  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Indexes for performance
  @@index([userId, createdAt])
  @@index([userId, deletedAt])
  @@map("work_entries")
}
```

### Environment Variables Security
```bash
# .env.local (Development)
DATABASE_URL="postgresql://username:password@localhost:5432/perf_tracker_dev"
NEXTAUTH_SECRET="your-super-secret-jwt-secret-here"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-your-openai-api-key"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# Production Environment Variables
DATABASE_URL="postgresql://..."          # Managed database URL
NEXTAUTH_SECRET="..."                   # Strong random secret
NEXTAUTH_URL="https://yourapp.com"      # Production URL
OPENAI_API_KEY="..."                    # Production API key
REDIS_URL="..."                         # Redis for caching/rate limiting
SENTRY_DSN="..."                        # Error tracking
```

### Content Security Policy
```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://api.openai.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
```

### Privacy Compliance
```typescript
// Data Retention Policy
export async function cleanupExpiredData() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  // Soft delete old data
  await prisma.workEntry.updateMany({
    where: {
      updatedAt: { lt: thirtyDaysAgo },
      deletedAt: null
    },
    data: {
      deletedAt: new Date()
    }
  })
  
  // Hard delete very old data
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  
  await prisma.workEntry.deleteMany({
    where: {
      deletedAt: { lt: oneYearAgo }
    }
  })
}

// GDPR Data Export
export async function exportUserData(userId: string) {
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      workEntries: true,
      conversations: {
        include: {
          messages: true
        }
      }
    }
  })
  
  // Remove sensitive system data
  return sanitizeExportData(userData)
}

// Data Anonymization
export async function anonymizeUserData(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: `deleted-${Date.now()}@example.com`,
      name: 'Deleted User',
      image: null,
      deletedAt: new Date()
    }
  })
}
```

### Security Best Practices Checklist
- [ ] All API endpoints require authentication
- [ ] Input validation on all user inputs
- [ ] SQL injection prevention with Prisma
- [ ] XSS prevention with content sanitization
- [ ] CSRF protection enabled
- [ ] Rate limiting on API endpoints
- [ ] Secure headers configuration
- [ ] Environment variables for secrets
- [ ] Database connection security
- [ ] Regular security dependency updates
- [ ] Error handling without information leakage
- [ ] Audit logging for sensitive operations
- [ ] Data encryption at rest and in transit
- [ ] Regular security testing and code reviews
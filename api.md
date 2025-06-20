# API Specifications & Database Schema

## API Specifications

### Base Configuration
```typescript
// API Response Types
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface PaginatedResponse<T> extends ApiResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
```

### Authentication APIs

#### POST /api/auth/register
```typescript
// Request Body
interface RegisterRequest {
  email: string
  password: string
  name: string
}

// Response
interface RegisterResponse {
  success: boolean
  data: {
    user: {
      id: string
      email: string
      name: string
    }
  }
}
```

#### POST /api/auth/login
```typescript
// Request Body
interface LoginRequest {
  email: string
  password: string
}

// Response
interface LoginResponse {
  success: boolean
  data: {
    user: User
    token: string
  }
}
```

### Chat APIs

#### POST /api/chat/messages
```typescript
// Request Body
interface CreateMessageRequest {
  conversationId?: string  // Optional for new conversations
  content: string
  type: 'user' | 'assistant'
}

// Response
interface CreateMessageResponse {
  success: boolean
  data: {
    message: {
      id: string
      content: string
      type: 'user' | 'assistant'
      timestamp: string
    }
    conversation: {
      id: string
      title?: string
    }
  }
}
```

#### GET /api/chat/conversations
```typescript
// Query Parameters
interface GetConversationsQuery {
  page?: number
  limit?: number
  search?: string
}

// Response
interface GetConversationsResponse extends PaginatedResponse<Conversation> {
  data: Array<{
    id: string
    title: string
    lastMessage: string
    lastMessageAt: string
    messageCount: number
  }>
}
```

#### GET /api/chat/conversations/[id]/messages
```typescript
// Query Parameters
interface GetMessagesQuery {
  page?: number
  limit?: number
}

// Response
interface GetMessagesResponse extends PaginatedResponse<Message> {
  data: Array<{
    id: string
    content: string
    type: 'user' | 'assistant'
    timestamp: string
    metadata?: Record<string, any>
  }>
}
```

#### POST /api/chat/stream
```typescript
// Request Body
interface StreamChatRequest {
  conversationId?: string
  message: string
  context?: {
    workEntries?: string[]
    previousMessages?: number
  }
}

// Server-Sent Events Response
// Content-Type: text/event-stream
// Events: 'message', 'thinking', 'complete', 'error'
```

### Work Entry APIs

#### POST /api/work-entries
```typescript
// Request Body
interface CreateWorkEntryRequest {
  title: string
  description: string
  impact?: string
  businessValue?: string
  technicalDetails?: string
  stakeholders?: string[]
  metrics?: Array<{
    name: string
    value: string | number
    unit?: string
  }>
  tags?: string[]
  date?: string  // ISO date string
}

// Response
interface CreateWorkEntryResponse {
  success: boolean
  data: {
    workEntry: WorkEntry
    aiSuggestions?: {
      missingInfo: string[]
      suggestedQuestions: string[]
      impactScore: number
    }
  }
}
```

#### GET /api/work-entries
```typescript
// Query Parameters
interface GetWorkEntriesQuery {
  page?: number
  limit?: number
  search?: string
  tags?: string[]
  dateFrom?: string
  dateTo?: string
  sortBy?: 'date' | 'impact' | 'title'
  sortOrder?: 'asc' | 'desc'
}

// Response
interface GetWorkEntriesResponse extends PaginatedResponse<WorkEntry> {
  data: Array<{
    id: string
    title: string
    description: string
    impact?: string
    impactScore: number
    tags: string[]
    createdAt: string
    updatedAt: string
  }>
}
```

#### PUT /api/work-entries/[id]
```typescript
// Request Body (same as CreateWorkEntryRequest)
interface UpdateWorkEntryRequest extends Partial<CreateWorkEntryRequest> {}

// Response
interface UpdateWorkEntryResponse {
  success: boolean
  data: {
    workEntry: WorkEntry
  }
}
```

#### DELETE /api/work-entries/[id]
```typescript
// Response
interface DeleteWorkEntryResponse {
  success: boolean
  message: string
}
```

### AI Integration APIs

#### POST /api/ai/analyze
```typescript
// Request Body
interface AnalyzeContentRequest {
  content: string
  type: 'work_entry' | 'conversation' | 'general'
  context?: Record<string, any>
}

// Response
interface AnalyzeContentResponse {
  success: boolean
  data: {
    analysis: {
      businessImpact: string
      technicalComplexity: number
      suggestedTags: string[]
      missingInformation: string[]
      impactScore: number
    }
    suggestions: {
      questions: string[]
      improvements: string[]
    }
  }
}
```

#### POST /api/ai/questions
```typescript
// Request Body
interface GenerateQuestionsRequest {
  workEntryId: string
  conversationContext?: string[]
}

// Response
interface GenerateQuestionsResponse {
  success: boolean
  data: {
    questions: Array<{
      question: string
      category: 'impact' | 'technical' | 'business' | 'metrics'
      priority: 'high' | 'medium' | 'low'
    }>
  }
}
```

### Performance Review APIs

#### POST /api/reviews/generate
```typescript
// Request Body
interface GenerateReviewRequest {
  periodStart: string  // ISO date
  periodEnd: string    // ISO date
  template: 'standard' | 'technical' | 'leadership' | 'custom'
  includeMetrics: boolean
  workEntryIds?: string[]  // Optional filter
  customSections?: Array<{
    title: string
    description: string
  }>
}

// Response
interface GenerateReviewResponse {
  success: boolean
  data: {
    review: {
      id: string
      title: string
      period: { start: string; end: string }
      sections: Array<{
        title: string
        content: string
        workEntries: string[]
      }>
      summary: string
      keyAchievements: string[]
      metrics: Array<{
        name: string
        value: string
        impact: string
      }>
    }
  }
}
```

#### GET /api/reviews
```typescript
// Query Parameters
interface GetReviewsQuery {
  page?: number
  limit?: number
  year?: number
}

// Response
interface GetReviewsResponse extends PaginatedResponse<PerformanceReview> {
  data: Array<{
    id: string
    title: string
    period: { start: string; end: string }
    createdAt: string
    status: 'draft' | 'final'
  }>
}
```

#### POST /api/reviews/[id]/export
```typescript
// Request Body
interface ExportReviewRequest {
  format: 'pdf' | 'docx' | 'html' | 'markdown'
  includeCharts: boolean
  template?: string
}

// Response
interface ExportReviewResponse {
  success: boolean
  data: {
    downloadUrl: string
    fileName: string
    expiresAt: string
  }
}
```

### Analytics APIs

#### GET /api/analytics/dashboard
```typescript
// Query Parameters
interface GetDashboardQuery {
  period?: '7d' | '30d' | '90d' | '1y'
}

// Response
interface GetDashboardResponse {
  success: boolean
  data: {
    totalWorkEntries: number
    totalImpactScore: number
    topTags: Array<{ tag: string; count: number }>
    activityTrend: Array<{ date: string; count: number }>
    impactDistribution: Array<{ range: string; count: number }>
    weeklyGoals: {
      target: number
      completed: number
    }
  }
}
```

## Database Schema

### Prisma Schema
```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// NextAuth.js required tables
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  // User preferences
  timezone      String    @default("UTC")
  theme         String    @default("system")
  weeklyGoal    Int       @default(5)

  // Relations
  accounts          Account[]
  sessions          Session[]
  workEntries       WorkEntry[]
  conversations     Conversation[]
  performanceReviews PerformanceReview[]
  userPreferences   UserPreference[]

  @@map("users")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// Main application tables
model WorkEntry {
  id                String   @id @default(cuid())
  userId            String
  title             String
  description       String   @db.Text
  impact            String?  @db.Text
  businessValue     String?  @db.Text
  technicalDetails  String?  @db.Text
  stakeholders      Json?    // Array of strings
  metrics           Json?    // Array of {name, value, unit}
  impactScore       Float    @default(0)
  complexity        Int      @default(1) // 1-5 scale
  workDate          DateTime @default(now())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?

  // Relations
  user              User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  tags              WorkEntryTag[]
  aiInteractions    AiInteraction[]
  reviewEntries     ReviewEntry[]

  // Indexes
  @@index([userId, workDate])
  @@index([userId, createdAt])
  @@index([userId, deletedAt])
  @@index([impactScore])
  @@map("work_entries")
}

model Tag {
  id          String   @id @default(cuid())
  name        String   @unique
  color       String?
  description String?
  createdAt   DateTime @default(now())

  // Relations
  workEntries WorkEntryTag[]

  @@map("tags")
}

model WorkEntryTag {
  id          String @id @default(cuid())
  workEntryId String
  tagId       String

  // Relations
  workEntry WorkEntry @relation(fields: [workEntryId], references: [id], onDelete: Cascade)
  tag       Tag       @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([workEntryId, tagId])
  @@map("work_entry_tags")
}

model Conversation {
  id          String   @id @default(cuid())
  userId      String
  title       String?
  status      String   @default("active") // active, archived, deleted
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  // Relations
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages Message[]

  // Indexes
  @@index([userId, createdAt])
  @@index([userId, status])
  @@map("conversations")
}

model Message {
  id             String   @id @default(cuid())
  conversationId String
  content        String   @db.Text
  type           String   // user, assistant, system
  metadata       Json?    // Additional context, tokens used, etc.
  createdAt      DateTime @default(now())

  // Relations
  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  // Indexes
  @@index([conversationId, createdAt])
  @@map("messages")
}

model AiInteraction {
  id          String   @id @default(cuid())
  userId      String
  workEntryId String?
  type        String   // analyze, question_generation, summarize
  prompt      String   @db.Text
  response    String   @db.Text
  metadata    Json?    // Model used, tokens, processing time
  createdAt   DateTime @default(now())

  // Relations
  workEntry WorkEntry? @relation(fields: [workEntryId], references: [id], onDelete: SetNull)

  // Indexes
  @@index([userId, createdAt])
  @@index([workEntryId])
  @@index([type])
  @@map("ai_interactions")
}

model PerformanceReview {
  id          String   @id @default(cuid())
  userId      String
  title       String
  periodStart DateTime
  periodEnd   DateTime
  template    String   @default("standard")
  content     Json     // Generated review content
  summary     String?  @db.Text
  status      String   @default("draft") // draft, final, archived
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  reviewEntries ReviewEntry[]

  // Indexes
  @@index([userId, periodStart, periodEnd])
  @@index([userId, status])
  @@map("performance_reviews")
}

model ReviewEntry {
  id                  String @id @default(cuid())
  performanceReviewId String
  workEntryId         String

  // Relations
  performanceReview PerformanceReview @relation(fields: [performanceReviewId], references: [id], onDelete: Cascade)
  workEntry         WorkEntry         @relation(fields: [workEntryId], references: [id], onDelete: Cascade)

  @@unique([performanceReviewId, workEntryId])
  @@map("review_entries")
}

model UserPreference {
  id     String @id @default(cuid())
  userId String
  key    String
  value  Json

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, key])
  @@map("user_preferences")
}

// Analytics and tracking
model ActivityLog {
  id        String   @id @default(cuid())
  userId    String
  action    String   // login, create_entry, generate_review, etc.
  entity    String?  // work_entry, conversation, review
  entityId  String?
  metadata  Json?
  createdAt DateTime @default(now())

  // Indexes
  @@index([userId, createdAt])
  @@index([action])
  @@map("activity_logs")
}
```

### Database Indexes
```sql
-- Additional performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_entries_text_search 
ON work_entries USING gin(to_tsvector('english', title || ' ' || description));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_text_search 
ON messages USING gin(to_tsvector('english', content));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_entries_impact_score_desc 
ON work_entries (user_id, impact_score DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_last_message 
ON conversations (user_id, updated_at DESC);
```

### Database Migrations Strategy
```typescript
// Migration naming convention
// YYYYMMDD_HHMMSS_description.sql

// Example: 20241201_120000_add_work_entry_impact_score.sql
ALTER TABLE work_entries ADD COLUMN impact_score FLOAT DEFAULT 0;
CREATE INDEX idx_work_entries_impact_score ON work_entries (impact_score);

// Always include rollback scripts
-- Rollback:
-- DROP INDEX IF EXISTS idx_work_entries_impact_score;
-- ALTER TABLE work_entries DROP COLUMN IF EXISTS impact_score;
```
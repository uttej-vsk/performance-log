# Cursor Vibe Coding Prompt - Performance Tracker AI

## 🎯 Project Vision
Build a conversational AI-powered performance tracking web app that acts like your **"friendly roommate"** who helps you document, analyze, and present your work contributions for performance reviews. The AI probes for business impact, asks follow-up questions, and transforms casual work updates into professional performance review materials.

## 🚀 What We're Building

### Core User Journey
1. **Daily Work Logging**: User casually tells the AI about their work - "Today I fixed the authentication bug and deployed the payment gateway"
2. **AI Probing**: AI acts curious and asks follow-up questions - "Nice! How many users were affected? What was the business impact?"
3. **Context Enrichment**: AI helps extract business value, metrics, and impact from casual conversations
4. **Performance Review Generation**: When review time comes, AI generates professional summaries with charts, metrics, and structured content

### Key Features to Build
- **Real-time Chat Interface** with streaming AI responses
- **Smart Work Entry Management** with automatic categorization
- **Timeline Dashboard** showing all contributions chronologically  
- **Performance Review Generator** with multiple professional templates
- **Analytics Dashboard** with personal metrics and trends
- **Secure Authentication** with Google OAuth and email/password

## 🛠 Tech Stack (Start Here)

### Foundation
```bash
# Initialize Next.js project with latest versions
npx create-next-app@latest performance-tracker --typescript --tailwind --eslint --app --src-dir

# Core dependencies (always use latest)
npm install @prisma/client@latest prisma@latest next-auth@latest @auth/prisma-adapter@latest
npm install @tanstack/react-query@latest openai@latest langchain@latest zod@latest react-hook-form@latest @hookform/resolvers@latest
npm install @radix-ui/react-dialog@latest @radix-ui/react-dropdown-menu@latest @radix-ui/react-slot@latest
npm install lucide-react@latest class-variance-authority@latest clsx@latest tailwind-merge@latest date-fns@latest next-themes@latest

# Development dependencies (always use latest)
npm install -D @types/node@latest @types/react@latest @types/react-dom@latest
npm install -D @typescript-eslint/eslint-plugin@latest @typescript-eslint/parser@latest prettier@latest
```

### Database Setup
```bash
# Initialize Prisma
npx prisma init

# Set up database URL in .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/perf_tracker_dev"

# Generate Prisma client after creating schema
npx prisma generate
npx prisma db push
```

## 🎨 UI/UX Design Direction

### Design Philosophy
- **Clean & Modern**: Think Notion/Linear aesthetic with good spacing and typography
- **Conversational UI**: Chat interface feels natural and engaging
- **Data-Rich Dashboards**: Charts and metrics that tell a story
- **Professional Output**: Generated reviews look polished and ready to present

### Component Library Strategy
- Use **shadcn/ui** as the foundation for consistent, accessible components
- Build custom chat components that feel conversational
- Create timeline components that show work progression beautifully
- Design review templates that look professional

## 🤖 AI Integration Strategy

### OpenAI Integration
```typescript
// Key AI capabilities to implement:
1. Conversational Analysis - Extract structured data from casual input
2. Follow-up Question Generation - Ask probing questions about impact
3. Content Summarization - Transform conversations into professional content
4. Business Impact Scoring - Rate the significance of contributions
5. Review Generation - Create structured performance review documents
```

### Conversation Flow Design
```
User: "Today I worked on the user authentication bug"

AI: "Great work! Let me ask a few questions to capture the full impact:
- How many users were affected by this bug?
- What happened when users couldn't authenticate?
- Was this blocking any business processes?
- Do you have any metrics on the impact?"

User: "About 200 users couldn't log in for a week, blocking purchases"

AI: "That's significant! So this authentication fix potentially restored purchase capability for 200 users. Do you know roughly how much revenue was at stake or how many purchases were blocked during that week?"
```

## 📁 Project Structure to Create
```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── signin/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Dashboard home
│   │   ├── chat/
│   │   │   ├── page.tsx            # Chat interface
│   │   │   └── [id]/page.tsx       # Specific conversation
│   │   ├── timeline/page.tsx        # Work entries timeline
│   │   ├── analytics/page.tsx       # Personal analytics
│   │   └── review/
│   │       ├── page.tsx            # Review list
│   │       ├── generate/page.tsx   # Generate new review
│   │       └── [id]/page.tsx       # View specific review
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── chat/
│   │   │   ├── messages/route.ts
│   │   │   └── stream/route.ts     # SSE endpoint
│   │   ├── work-entries/route.ts
│   │   ├── ai/analyze/route.ts
│   │   └── reviews/generate/route.ts
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   └── TypingIndicator.tsx
│   ├── dashboard/
│   │   ├── Timeline.tsx
│   │   ├── Analytics.tsx
│   │   └── QuickActions.tsx
│   ├── review/
│   │   ├── ReviewGenerator.tsx
│   │   ├── TemplateSelector.tsx
│   │   └── ExportOptions.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Navigation.tsx
├── lib/
│   ├── auth.ts                     # NextAuth config
│   ├── db.ts                       # Prisma client
│   ├── ai.ts                       # OpenAI integration
│   └── utils.ts
├── hooks/
│   ├── use-auth.ts
│   ├── use-work-entries.ts
│   └── use-chat.ts
├── types/
│   └── index.ts
└── prisma/
    └── schema.prisma
```

## 🎬 Development Phases

### Phase 1: Foundation (Week 1)
**Goal**: Get basic auth and chat working
```typescript
// Deliverables:
1. Next.js 14 setup with TypeScript and Tailwind
2. NextAuth.js with Google OAuth
3. Basic database schema with Prisma
4. Simple chat interface with OpenAI integration
5. Basic dashboard layout with navigation
```

### Phase 2: Core Features (Week 2-3)
**Goal**: Implement work entry management and AI analysis
```typescript
// Deliverables:
1. Work entry creation and management
2. AI-powered conversation analysis
3. Follow-up question generation
4. Timeline view of work entries
5. Basic analytics dashboard
```

### Phase 3: Advanced Features (Week 4-5)
**Goal**: Performance review generation and polish
```typescript
// Deliverables:
1. Performance review generation system
2. Multiple review templates
3. Export functionality (PDF, DOCX)
4. Advanced analytics and charts
5. Mobile responsiveness and polish
```

## 💡 Key Implementation Tips

### Start With These Components First
1. **Authentication Setup** - Get NextAuth working with Google OAuth
2. **Database Schema** - Set up core tables (users, work_entries, conversations, messages)
3. **Basic Chat UI** - Simple message list and input with OpenAI streaming
4. **Work Entry Form** - Allow manual entry creation to test the flow
5. **Simple Dashboard** - Show recent entries and basic stats

### AI Integration Approach
```typescript
// Build these AI functions progressively:
1. analyzeWorkEntry(content: string) -> structured data + questions
2. generateFollowUpQuestions(workEntry: WorkEntry) -> question array
3. scoreBusinessImpact(workEntry: WorkEntry) -> impact score
4. generateReviewSection(workEntries: WorkEntry[]) -> formatted content
5. createFullReview(period: DateRange, template: string) -> complete review
```

### Database Design Priority
```sql
-- Start with these core tables:
users (NextAuth + preferences)
work_entries (main content storage)
conversations (chat sessions)
messages (individual chat messages)
ai_interactions (track AI usage)

-- Add later:
performance_reviews (generated reviews)
tags (categorization)
user_preferences (settings)
activity_logs (analytics)
```

## 🎯 Success Metrics to Track
- **User Engagement**: Daily active users, messages per session
- **Feature Usage**: Work entries created, reviews generated
- **AI Effectiveness**: Questions asked, impact scores improved
- **Business Value**: Time saved in performance review prep
- **User Satisfaction**: Review quality ratings, retention

## 🚨 Important Considerations

### Security & Privacy
- **Data Encryption**: All work data is sensitive - encrypt at rest
- **Access Control**: Users can only see their own data
- **API Security**: Rate limiting, input validation, CSRF protection
- **Compliance**: GDPR-ready with data export and deletion

### Performance
- **Real-time Chat**: Use Server-Sent Events for AI streaming
- **Database Optimization**: Proper indexing for timeline queries
- **Caching Strategy**: Cache user stats and recent entries
- **AI Cost Management**: Token usage monitoring and optimization

### User Experience
- **Onboarding**: Guide users through first conversation
- **Error Handling**: Graceful failures with helpful messages
- **Loading States**: Show progress for AI operations
- **Mobile First**: Works great on phones for quick updates

## 🎨 Design Inspiration
- **Chat UI**: Discord, Slack for message threading
- **Dashboard**: Linear, Notion for clean data display
- **Timeline**: GitHub contributions, LinkedIn activity
- **Analytics**: Vercel Analytics, Stripe Dashboard

## 🔥 Killer Features to Implement
1. **Smart Suggestions**: AI suggests missing information proactively
2. **Impact Tracking**: Visual charts showing contribution growth
3. **Team Integration**: Share achievements with managers
4. **Goal Setting**: AI helps set and track professional goals
5. **Industry Benchmarking**: Compare progress against industry standards

## 🎬 Start Coding Now!

Begin with this exact command sequence:
```bash
npx create-next-app@latest performance-tracker --typescript --tailwind --eslint --app --src-dir
cd performance-tracker
npm install @prisma/client@latest prisma@latest next-auth@latest @auth/prisma-adapter@latest @tanstack/react-query@latest openai@latest zod@latest
```

Then set up:
1. **Environment variables** in `.env.local`
2. **Prisma schema** with core tables
3. **NextAuth configuration** 
4. **Basic chat component** with OpenAI streaming
5. **Simple dashboard** layout

**Remember**: This app should feel like talking to a smart friend who genuinely cares about helping you succeed in your career. Every interaction should feel natural, helpful, and focused on extracting the real value and impact of your work.

Start building and let the AI help users tell their professional story better! 🚀
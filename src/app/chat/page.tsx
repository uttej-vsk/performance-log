import { requireAuth } from '@/lib/auth-utils'
import ChatInterface from '@/components/chat/ChatInterface'

export default async function ChatPage() {
  await requireAuth()
  
  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatInterface />
    </div>
  )
}

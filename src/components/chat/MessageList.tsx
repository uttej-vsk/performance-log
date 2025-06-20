import { User, Bot } from 'lucide-react'

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp?: Date;
}

interface MessageListProps {
  messages: Message[];
  currentAssistantMessage?: string;
  isLoading?: boolean;
}

export default function MessageList({ messages, currentAssistantMessage, isLoading }: MessageListProps) {
  return (
    <div className="space-y-6">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex items-start gap-4`}
        >
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.type === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
            {msg.type === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
          </div>
          <div className="flex-1">
            <p className="text-gray-200 whitespace-pre-wrap">
              {msg.content}
            </p>
            {msg.timestamp && (
              <p className="text-xs text-gray-500 mt-1">
                {msg.timestamp.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      ))}
      
      {/* Show streaming message */}
      {isLoading && currentAssistantMessage && (
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-700">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-gray-200 whitespace-pre-wrap">
              {currentAssistantMessage}
              <span className="animate-pulse">▋</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 
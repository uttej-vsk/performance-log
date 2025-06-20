import { MessageSquare } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp?: Date;
}

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  return (
    <div className="space-y-4">
      {messages.map((msg, index) => (
        <div
          key={msg.id || index}
          className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`prose prose-invert max-w-xl px-4 py-2 rounded-lg ${
              msg.type === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-200'
            }`}
          >
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        </div>
      ))}
      {messages.length > 0 && messages[messages.length-1].type === 'user' && (
        <div className="flex justify-start">
          <div className="max-w-xl px-4 py-2 rounded-lg bg-gray-700 text-gray-200 animate-pulse">
            <MessageSquare className="w-5 h-5 inline-block mr-2" />
            Thinking...
          </div>
        </div>
      )}
    </div>
  )
} 
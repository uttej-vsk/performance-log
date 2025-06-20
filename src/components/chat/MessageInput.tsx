import { useState } from 'react'
import { ArrowUp } from 'lucide-react'

interface MessageInputProps {
  onSend: (content: string) => void;
  isLoading?: boolean;
}

export default function MessageInput({ onSend, isLoading }: MessageInputProps) {
  const [value, setValue] = useState('')

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (value.trim() && !isLoading) {
      onSend(value)
      setValue('')
    }
  }

  return (
    <form
      onSubmit={handleSend}
      className="bg-gray-800/80 border border-gray-700 rounded-2xl p-2 flex items-center w-full"
    >
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
          }
        }}
        className="flex-1 bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none resize-none px-3 py-2 disabled:opacity-50"
        placeholder={isLoading ? "AI is thinking..." : "Ask anything..."}
        rows={1}
        disabled={isLoading}
      />
      <button
        type="submit"
        className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 transition-colors text-white rounded-lg p-2"
        disabled={!value.trim() || isLoading}
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </form>
  )
} 
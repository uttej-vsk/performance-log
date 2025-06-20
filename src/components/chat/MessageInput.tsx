"use client"

import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Paperclip, X } from 'lucide-react'

interface MessageInputProps {
  onSendMessage: (message: string, file?: File) => void
  isLoading: boolean
}

export default function MessageInput({ onSendMessage, isLoading }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    if(fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((message.trim() || file) && !isLoading) {
      onSendMessage(message, file || undefined)
      setMessage('')
      removeFile()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative bg-gray-800 border-2 border-gray-700 rounded-lg">
      {filePreview && (
        <div className="p-2 relative">
          <img src={filePreview} alt="Preview" className="max-h-24 rounded-md" />
          <button
            type="button"
            onClick={removeFile}
            className="absolute top-0 right-0 m-1 bg-gray-900 rounded-full p-1 text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex items-center p-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/gif"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-400 hover:text-white"
          disabled={isLoading}
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything, or attach an image..."
          rows={1}
          className="flex-1 w-full resize-none bg-transparent text-gray-200 placeholder-gray-400 focus:outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || (!message.trim() && !file)}
          className="ml-2 w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-70 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
        >
          <ArrowUp className="w-5 h-5 text-white" />
        </button>
      </div>
    </form>
  )
} 
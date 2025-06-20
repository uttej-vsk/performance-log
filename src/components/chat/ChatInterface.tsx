"use client"

import { useState, useRef, useEffect } from 'react'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { Plus, CheckSquare } from 'lucide-react'

// Define the message type
interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp?: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Add user message to state
    const userMessage: Message = { 
      id: Date.now().toString(), 
      content, 
      type: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Start loading state
    setIsLoading(true);
    setCurrentAssistantMessage('');

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Prepare messages for AI (excluding the current assistant message)
      const messagesForAI = messages.map(msg => ({
        role: msg.type as 'user' | 'assistant',
        content: msg.content,
      }));

      // Add the current user message
      messagesForAI.push({
        role: 'user',
        content,
      });

      // Call the streaming API
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesForAI,
          conversationId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let assistantMessageId = (Date.now() + 1).toString();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // Streaming complete
              const finalMessage: Message = {
                id: assistantMessageId,
                content: fullContent,
                type: 'assistant',
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, finalMessage]);
              setCurrentAssistantMessage('');
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setCurrentAssistantMessage(fullContent);
              }
            } catch (e) {
              // Ignore parsing errors for partial chunks
            }
          }
        }
      }

      // Store messages in database
      await storeMessages(userMessage, {
        id: assistantMessageId,
        content: fullContent,
        type: 'assistant' as const,
        timestamp: new Date(),
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, don't show error
        return;
      }
      
      console.error('Chat error:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        type: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const storeMessages = async (userMessage: Message, assistantMessage: Message) => {
    try {
      // Store user message
      const userResponse = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: userMessage.content,
          type: 'user',
          conversationId,
        }),
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (!conversationId) {
          setConversationId(userData.data.conversation.id);
        }
      }

      // Store assistant message
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: assistantMessage.content,
          type: 'assistant',
          conversationId: conversationId || undefined,
        }),
      });
    } catch (error) {
      console.error('Failed to store messages:', error);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setCurrentAssistantMessage('');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleSaveEntry = async () => {
    if (messages.length === 0) return;
    setIsSaving(true);
    try {
      const conversationText = messages.map(m => `${m.type === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
      
      const response = await fetch('/api/work-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationText,
          conversationId: conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save work entry.');
      }

      // Optionally, you could show a success message or clear the chat.
      // For now, we'll just log it.
      const result = await response.json();
      console.log('Work entry saved:', result.data);

      // Maybe start a new conversation after saving?
      startNewConversation();

    } catch (error) {
      console.error('Save entry error:', error);
      // You could show an error toast to the user here
    } finally {
      setIsSaving(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full p-4 md:p-8">
      <div className="w-full max-w-4xl h-full flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h1 className="text-4xl font-semibold text-gray-300">Performance Tracker</h1>
            <p className="text-gray-500 mt-2">What's on your mind today?</p>
            <p className="text-gray-400 mt-1 text-sm">Tell me about your work and I'll help you document it effectively.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-4">
            <MessageList 
              messages={messages} 
              currentAssistantMessage={currentAssistantMessage}
              isLoading={isLoading}
            />
          </div>
        )}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={startNewConversation}
              className="text-sm text-gray-500 hover:text-gray-300"
            >
              New Conversation
            </button>
            <button
              onClick={handleSaveEntry}
              disabled={isSaving || messages.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-70 transition-colors"
            >
              <CheckSquare size={16} />
              {isSaving ? 'Saving...' : 'Save as Work Entry'}
            </button>
          </div>
          <MessageInput onSend={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
} 
"use client"

import { useState, useRef } from 'react'
import MessageList from '@/components/chat/MessageList'
import MessageInput from '@/components/chat/MessageInput'
import { CheckSquare } from 'lucide-react'

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
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Helper function to render the empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-4xl font-bold text-gray-300">Performance Tracker</h1>
      <p className="text-lg text-gray-500 mt-2">What's on your mind today?</p>
      <p className="text-sm text-gray-600 mt-1">Tell me about your work and I'll help you document it effectively.</p>
    </div>
  );

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { 
      id: Date.now().toString(), 
      content, 
      type: 'user',
      timestamp: new Date()
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const messagesForAI = newMessages.map(msg => ({
        role: msg.type as 'user' | 'assistant',
        content: msg.content,
      }));

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesForAI, conversationId }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Failed to get AI response');
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let assistantMessageId = (Date.now() + 1).toString();
      let fullContent = '';
      
      const assistantMessage: Message = {
        id: assistantMessageId,
        content: '',
        type: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullContent += new TextDecoder().decode(value);
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId ? { ...msg, content: fullContent } : msg
          ));
        }
      };
      await processStream();

      const finalAssistantMessage = { ...assistantMessage, content: fullContent };
      
      // Update the message list with the final assistant message
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId ? finalAssistantMessage : msg
      ));
      
      await storeMessages(userMessage, finalAssistantMessage);

    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Chat error:', error);
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          content: 'Sorry, I encountered an error. Please try again.',
          type: 'assistant',
          timestamp: new Date(),
        }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const storeMessages = async (userMessage: Message, assistantMessage: Message) => {
    try {
      // First, store the user message and get the conversation ID
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: userMessage.content,
          type: 'user',
          conversationId, // This can be null for the first message
        }),
      });
      
      if (!res.ok) throw new Error('Failed to save user message.');

      const { data } = await res.json();
      const newConversationId = data.conversation.id;
      
      if (!conversationId) {
        setConversationId(newConversationId);
      }

      // Then, store the assistant message with the correct conversation ID
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: assistantMessage.content,
          type: 'assistant',
          conversationId: newConversationId,
        }),
      });
    } catch (error) {
      console.error('Failed to store messages:', error);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    if (abortControllerRef.current) abortControllerRef.current.abort();
  };

  const handleSaveEntry = async () => {
    if (isSaving || !conversationId || messages.length === 0) return;
    setIsSaving(true);
    try {
      const conversationText = messages.map(m => `${m.type}: ${m.content}`).join('\n');
      await fetch('/api/work-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationText, conversationId }),
      });
      // Optionally, show a success toast/message
    } catch (error) {
      console.error("Failed to save work entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? renderEmptyState() : <MessageList messages={messages} />}
      </div>
      <div className="p-4 bg-gray-900 border-t border-gray-700">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={startNewConversation}
              className="text-sm text-gray-400 hover:text-white"
            >
              New Conversation
            </button>
            <button
              onClick={handleSaveEntry}
              disabled={isSaving || !conversationId || messages.length === 0}
              className="flex items-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save as Work Entry'}</span>
            </button>
          </div>
          <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
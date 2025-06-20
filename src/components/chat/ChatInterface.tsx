"use client"

import { useState, useEffect, useRef } from 'react'
import MessageList from '@/components/chat/MessageList'
import MessageInput from '@/components/chat/MessageInput'
import { CheckSquare } from 'lucide-react'
import ConversationSidebar from './ConversationSidebar'
import { useConversations } from '@/hooks/useConversations'

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
  const [showSidebar, setShowSidebar] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const abortControllerRef = useRef<AbortController>(new AbortController());

  const { loadConversation, refreshConversations } = useConversations();

  // Load conversation from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const convId = urlParams.get('conversation');
    if (convId) {
      handleLoadConversation(convId);
    }
  }, []);

  // Update URL when conversation changes
  useEffect(() => {
    const url = new URL(window.location.href);
    if (conversationId) {
      url.searchParams.set('conversation', conversationId);
    } else {
      url.searchParams.delete('conversation');
    }
    window.history.replaceState({}, '', url.toString());
  }, [conversationId]);

  const handleLoadConversation = async (convId: string) => {
    const data = await loadConversation(convId);
    if (data) {
      setMessages(data.messages);
      setConversationId(data.conversation.id);
    }
  };

  // Helper function to render the empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-4xl font-bold text-gray-300">Performance Tracker</h1>
      <p className="text-lg text-gray-500 mt-2">What's on your mind today?</p>
      <p className="text-sm text-gray-600 mt-1">Tell me about your work and I'll help you document it effectively.</p>
    </div>
  );

  // Auto-save when conversation reaches certain criteria
  const shouldAutoSave = (messages: Message[]) => {
    // Auto-save if we have at least 4 messages (2 exchanges) and the last message is from AI
    if (messages.length >= 4 && messages[messages.length - 1].type === 'assistant') {
      const lastMessage = messages[messages.length - 1].content.toLowerCase();
      // Check if the AI is suggesting the conversation is complete
      const completionKeywords = [
        'is there anything else',
        'anything else you',
        'any other work',
        'any other projects',
        'anything else you\'d like',
        'any other contributions',
        'any other achievements'
      ];
      return completionKeywords.some(keyword => lastMessage.includes(keyword));
    }
    return false;
  };

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

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
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
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            setIsLoading(false);
            break;
          }
          fullContent += decoder.decode(value, { stream: true });
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId ? { ...msg, content: fullContent } : msg
          ));
        }
      };
      await processStream();

      const finalAssistantMessage = { ...assistantMessage, content: fullContent };
      
      const updatedMessages = [...newMessages, finalAssistantMessage];
      setMessages(updatedMessages);
      
      await storeMessages(userMessage, finalAssistantMessage);

      if (shouldAutoSave(updatedMessages)) {
        setTimeout(() => handleSaveEntry(true), 1000);
      }

    } catch (error) {
      console.error('Chat error:', error);
      setIsLoading(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        type: 'assistant',
        timestamp: new Date(),
      }]);
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

      // Refresh the conversations list to show the new conversation
      refreshConversations();
    } catch (error) {
      console.error('Failed to store messages:', error);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setSaveStatus('idle');
    if (eventSourceRef.current) eventSourceRef.current.close();
  };

  const handleSelectConversation = (convId: string) => {
    handleLoadConversation(convId);
  };

  const handleSaveEntry = async (isAutoSave = false) => {
    if (isSaving || !conversationId || messages.length === 0) return;
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      const conversationText = messages.map(m => `${m.type}: ${m.content}`).join('\n');
      const response = await fetch('/api/work-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationText, conversationId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save work entry');
      }
      
      const result = await response.json();
      if (result.success) {
        setSaveStatus('success');
        // Reset success status after 3 seconds
        setTimeout(() => setSaveStatus('idle'), 3000);
        
        if (isAutoSave) {
          // For auto-save, start a new conversation
          setTimeout(() => {
            startNewConversation();
          }, 2000);
        }
      } else {
        throw new Error(result.error || 'Failed to save work entry');
      }
    } catch (error) {
      console.error("Failed to save work entry:", error);
      setSaveStatus('error');
      // Reset error status after 5 seconds
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const getSaveButtonText = () => {
    switch (saveStatus) {
      case 'saving': return 'Saving...';
      case 'success': return 'Saved! ✓';
      case 'error': return 'Save Failed';
      default: return 'Save as Work Entry';
    }
  };

  const getSaveButtonClass = () => {
    const baseClass = "flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors";
    
    switch (saveStatus) {
      case 'saving': return `${baseClass} bg-gray-600 text-gray-300 cursor-not-allowed`;
      case 'success': return `${baseClass} bg-green-600 text-white`;
      case 'error': return `${baseClass} bg-red-600 text-white`;
      default: return `${baseClass} bg-gray-700 hover:bg-gray-600 text-white`;
    }
  };

  return (
    <div className="flex h-full bg-background text-foreground">
      {/* Conversation Sidebar */}
      {showSidebar && (
        <ConversationSidebar
          onSelectConversation={handleSelectConversation}
          onNewConversation={startNewConversation}
          currentConversationId={conversationId}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-100">
                {conversationId ? 'Chat' : 'New Conversation'}
              </h1>
            </div>
            <button
              onClick={startNewConversation}
              className="text-sm text-gray-400 hover:text-white"
            >
              New Conversation
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? renderEmptyState() : <MessageList messages={messages} />}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-900 border-t border-gray-700">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1"></div>
              <button
                onClick={() => handleSaveEntry(false)}
                disabled={isSaving || !conversationId || messages.length === 0}
                className={getSaveButtonClass()}
              >
                <CheckSquare className="w-4 h-4" />
                <span>{getSaveButtonText()}</span>
              </button>
            </div>
            <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
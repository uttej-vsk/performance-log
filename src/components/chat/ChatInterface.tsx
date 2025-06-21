"use client"

import { useState, useEffect, useRef } from 'react'
import MessageInput from '@/components/chat/MessageInput'
import ConversationSidebar from './ConversationSidebar'
import { useConversations, loadConversation } from '@/hooks/useConversations'
import { ChatMessage as ChatMessageRenderer } from './ChatMessage'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Message as BaseMessage, Conversation } from '@/types'

export default function ChatInterface() {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<BaseMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const abortControllerRef = useRef<AbortController>(new AbortController());
  const { data: session } = useSession();
  const { 
    data: conversations = [], 
    refetch: refetchConversations, 
    isLoading: conversationsLoading 
  } = useConversations();
  const currentConversation = conversations.find((c: Conversation) => c.id === currentConversationId);

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
    if (currentConversationId) {
      url.searchParams.set('conversation', currentConversationId);
    } else {
      url.searchParams.delete('conversation');
    }
    window.history.replaceState({}, '', url.toString());
  }, [currentConversationId]);

  // When currentConversationId changes, load its messages
  useEffect(() => {
    const loadMessages = async () => {
      if (currentConversationId) {
        setIsLoadingMessages(true);
        const data = await loadConversation(currentConversationId);
        const loaded = data ? data.messages.map(m => ({ role: m.type as 'user' | 'assistant', content: m.content })) : [];
        setMessages(loaded);
        setIsLoadingMessages(false);
      } else {
        setMessages([]);
      }
    };
    loadMessages();
  }, [currentConversationId]);

  const handleLoadConversation = async (convId: string) => {
    const data = await loadConversation(convId);
    if (data) {
      setMessages(data.messages.map(m => ({ role: m.type as 'user' | 'assistant', content: m.content })));
      setCurrentConversationId(data.conversation.id);
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
  const shouldAutoSave = (messages: BaseMessage[]) => {
    // Auto-save if we have at least 4 messages (2 exchanges) and the last message is from AI
    if (messages.length >= 4 && messages[messages.length - 1].role === 'assistant') {
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

  const JIRA_URL_REGEX = /https?:\/\/[a-zA-Z0-9\.-]+\/browse\/[A-Z]+-\d+/;

  const handleSendMessage = async (content: string, file?: File) => {
    if (isSendingMessage) return;
    
    setIsSendingMessage(true);
    let tempFilePath: string | undefined = undefined;
    if (file) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/chat/image-upload', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        if (result.success) {
          tempFilePath = result.filePath;
        } else {
          throw new Error(result.error || 'File upload failed');
        }
      } catch (error) {
        console.error('File upload error:', error);
        // Handle error (e.g., show a toast to the user)
        setIsSendingMessage(false);
        return;
      }
    }

    const userMessage: BaseMessage = { role: 'user', content };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    try {
      const messagesForAI = newMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        // We only need to send the temp path for the latest user message
        filePath: msg.role === 'user' ? tempFilePath : undefined,
      }));

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesForAI, conversationId: currentConversationId }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Failed to get AI response');
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let assistantMessageId = (Date.now() + 1).toString();
      let fullContent = '';
      
      const assistantMessage: BaseMessage = {
        role: 'assistant',
        content: '',
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      const processStream = async () => {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            setIsSendingMessage(false);
            break;
          }
          fullContent += decoder.decode(value, { stream: true });
          setMessages(prev => prev.map(msg => 
            msg.role === 'assistant' ? { ...msg, content: fullContent } : msg
          ));
        }
      };
      await processStream();

      const finalAssistantMessage: BaseMessage = { ...assistantMessage, content: fullContent };
      
      const updatedMessages = [...newMessages, finalAssistantMessage];
      setMessages(updatedMessages);
      
      await storeMessages(userMessage, finalAssistantMessage);

      if (shouldAutoSave(updatedMessages)) {
        setTimeout(() => handleSaveEntry(true), 1000);
      }

    } catch (error) {
      console.error('Chat error:', error);
      setIsSendingMessage(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    }
  };

  const storeMessages = async (userMessage: BaseMessage, assistantMessage: BaseMessage) => {
    try {
      // First, store the user message and get the conversation ID
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: userMessage.content,
          type: 'user',
          conversationId: currentConversationId, // This can be null for the first message
        }),
      });
      
      if (!res.ok) throw new Error('Failed to save user message.');

      const { data } = await res.json();
      const newConversationId = data.conversation.id;
      
      if (!currentConversationId) {
        setCurrentConversationId(newConversationId);
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
      refetchConversations();
    } catch (error) {
      console.error('Failed to store messages:', error);
    }
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setSaveStatus('idle');
    if (eventSourceRef.current) eventSourceRef.current.close();
  };

  const handleSaveEntry = async (isAutoSave = false) => {
    if (isSaving || !currentConversationId || messages.length === 0) return;
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const response = await fetch('/api/work-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationText, conversationId: currentConversationId }),
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
            handleNewConversation();
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
    <div className="flex h-screen bg-background">
      <ConversationSidebar 
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        isLoading={conversationsLoading}
      />
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">
            {currentConversation ? currentConversation.title : 'New Conversation'}
          </h2>
          <Button
            variant="outline"
            onClick={handleNewConversation}
          >
            New Conversation
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center pt-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              messages.map((message, index) => <ChatMessageRenderer key={index} message={message} />)
            )}
            {isSendingMessage && (
               <ChatMessageRenderer message={{ role: 'assistant', content: '...' }} />
            )}
          </div>
        </div>
        <div className="p-4 border-t">
          <MessageInput
            onSendMessage={handleSendMessage}
            isLoading={isSendingMessage}
          />
        </div>
      </main>
    </div>
  );
}
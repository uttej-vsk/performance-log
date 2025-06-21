export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id?: string;
  type?: 'user' | 'assistant';
  timestamp?: Date;
  filePath?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt?: string;
  lastMessage?: string;
  lastMessageType?: string;
  messageCount?: number;
}

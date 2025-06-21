import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Message } from '@/types';

interface ChatMessageProps {
  message: Pick<Message, 'role' | 'content'>;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn('flex items-start gap-4', {
        'justify-end': isUser,
      })}
    >
      <div
        className={cn(
          'flex flex-col rounded-lg p-4 max-w-2xl',
          {
            'bg-primary text-primary-foreground': isUser,
            'bg-muted': !isUser,
          }
        )}
      >
        <div className="prose prose-stone dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc list-inside" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal list-inside" {...props} />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
} 
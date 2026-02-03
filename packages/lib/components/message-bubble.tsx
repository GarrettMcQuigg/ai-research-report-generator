import { Bot, User } from 'lucide-react';
import { cn } from '../utils';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div className={cn('flex-shrink-0 size-8 rounded-full flex items-center justify-center', isUser ? 'bg-foreground text-background' : 'bg-muted border border-border')}>
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>
      <div className={cn('flex flex-col gap-1 max-w-[75%]', isUser && 'items-end')}>
        <div className={cn('rounded-2xl px-4 py-3', isUser ? 'bg-foreground text-background rounded-br-md' : 'bg-muted border border-border rounded-bl-md')}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <span className="text-[11px] text-muted-foreground px-1">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}

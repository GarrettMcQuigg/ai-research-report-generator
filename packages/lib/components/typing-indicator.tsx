import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 size-8 rounded-full flex items-center justify-center bg-muted border border-border">
        <Bot className="size-4" />
      </div>
      <div className="flex items-center gap-2 bg-muted border border-border rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-1.5 rounded-full bg-foreground/40 animate-pulse" style={{ animationDelay: `${i * 200}ms`, animationDuration: '1s' }} />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">Researching...</span>
      </div>
    </div>
  );
}

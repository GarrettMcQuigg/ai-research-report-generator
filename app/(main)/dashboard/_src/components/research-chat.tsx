'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/packages/lib/components/button';
import { Input } from '@/packages/lib/components/input';
import { Send, Sparkles, ArrowRight } from 'lucide-react';
import { TypingIndicator } from '@/packages/lib/components/typing-indicator';
import { Message, MessageBubble } from '@/packages/lib/components/message-bubble';

const EXAMPLE_PROMPTS = ['The impact of artificial intelligence on healthcare', 'Latest developments in renewable energy', 'History and future of quantum computing'];

function EmptyState({ onSelectPrompt }: { onSelectPrompt: (prompt: string) => void }) {
  return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="max-w-xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-foreground/5 border border-border">
            <Sparkles className="size-8 text-foreground/70" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-balance">What would you like to research?</h2>
            <p className="text-muted-foreground text-balance">Our AI agents will gather information, verify sources, and generate a comprehensive report.</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Try an example</p>
          <div className="flex flex-col gap-2">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => onSelectPrompt(prompt)}
                className="group flex items-center justify-between gap-4 w-full text-left px-4 py-3 rounded-xl border border-border 
                bg-card hover:bg-accent/50 hover:border-foreground/10 transition-all duration-200 cursor-pointer"
              >
                <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">{prompt}</span>
                <ArrowRight className="size-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResearchChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // TODO: Implement API call to generate research report
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'll start researching "${userMessage.content}" for you. This will involve multiple AI agents working together to gather information, verify sources, and generate a comprehensive report.`,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSelectPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onSelectPrompt={handleSelectPrompt} />
        ) : (
          <div className="p-6 space-y-6 max-w-3xl mx-auto">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-border bg-background/80 backdrop-blur-sm p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 bg-muted/50 border border-border rounded-xl p-2 focus-within:border-foreground/20 focus-within:ring-2 focus-within:ring-foreground/5 transition-all duration-200">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your research topic..."
              disabled={isLoading}
              className="flex-1 h-10 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm placeholder:text-muted-foreground/70"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="size-10 rounded-lg shrink-0">
              <Send className="size-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

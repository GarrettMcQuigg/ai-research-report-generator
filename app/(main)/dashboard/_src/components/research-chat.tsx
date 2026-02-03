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
    const topic = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const { fetcher } = await import('@/packages/lib/helpers/fetcher');
      const { API_REPORTS_GENERATE_ROUTE } = await import('@/packages/lib/routes');

      const response = await fetcher({
        url: API_REPORTS_GENERATE_ROUTE,
        requestBody: { topic }
      });

      if (response.err) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${response.message}`,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        const { reportId } = response.content;
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I've started researching "${topic}" for you! My team of AI agents are now:\n\n1. 📋 Planning the research strategy\n2. 🔍 Gathering information from trusted sources\n3. 🎯 Verifying and critiquing findings\n4. ✍️ Writing a comprehensive report\n5. ✅ Reviewing for accuracy and clarity\n\nYou'll receive the complete report shortly!`,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Poll for report completion
        pollReportStatus(reportId, topic);
      }
    } catch (error) {
      console.error('Error generating research:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, something went wrong while processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const pollReportStatus = async (reportId: string, topic: string) => {
    const { fetcher } = await import('@/packages/lib/helpers/fetcher');
    const { API_REPORTS_GET_ROUTE } = await import('@/packages/lib/routes');
    const { HttpMethods } = await import('@/packages/lib/constants/http-methods');

    const maxAttempts = 60; // Poll for up to 5 minutes (60 * 5 seconds)
    let attempts = 0;

    const poll = async () => {
      attempts++;

      const response = await fetcher({
        url: API_REPORTS_GET_ROUTE(reportId),
        method: HttpMethods.GET
      });

      if (response.err) {
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Failed to check report status: ${response.message}`,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      const report = response.content;

      if (report.status === 'COMPLETED' && report.finalReport) {
        const reportMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `# Research Report: ${topic}\n\n${report.finalReport}`,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, reportMessage]);
        setIsLoading(false);
      } else if (report.status === 'FAILED') {
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Report generation failed: ${report.errorMessage || 'Unknown error'}`,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
      } else if (attempts < maxAttempts) {
        // Continue polling
        setTimeout(poll, 5000); // Poll every 5 seconds
      } else {
        const timeoutMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Report generation is taking longer than expected. Please check back later.',
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, timeoutMessage]);
        setIsLoading(false);
      }
    };

    poll();
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

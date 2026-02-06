'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/packages/lib/components/button';
import { Input } from '@/packages/lib/components/input';
import { Send, Sparkles, ArrowRight, X } from 'lucide-react';
import { TypingIndicator } from '@/packages/lib/components/typing-indicator';
import { Message, MessageBubble } from '@/packages/lib/components/message-bubble';
import { ReportStatusIndicator } from '@/packages/lib/components/report-status-indicator';

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
              <Button
                key={prompt}
                variant="outline"
                onClick={() => onSelectPrompt(prompt)}
                className="group justify-between h-auto px-4 py-3 border-border hover:bg-accent/50 hover:border-foreground/10"
              >
                <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">{prompt}</span>
                <ArrowRight className="size-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type ReportStatus = 'PENDING' | 'PLANNING' | 'RESEARCHING' | 'VALIDATING' | 'CRITIQUING' | 'WRITING' | 'FORMATTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export function ResearchChat() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentReportStatus, setCurrentReportStatus] = useState<ReportStatus | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clear messages when "new" search param changes (New Chat clicked)
  useEffect(() => {
    const newParam = searchParams.get('new');
    if (newParam) {
      // Clear all state
      setMessages([]);
      setInput('');
      setIsLoading(false);
      setCurrentReportStatus(null);
      setCurrentTopic('');
      setCurrentReportId(null);

      // Clear polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [searchParams]);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

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
    setCurrentTopic(topic);
    setCurrentReportStatus('PENDING');

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
        setIsLoading(false);
        setCurrentReportStatus(null);
      } else {
        const { reportId } = response.content;
        setCurrentReportId(reportId);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I've started researching "${topic}" for you! My team of AI agents are now:\n\n1. 📋 Planning the research strategy\n2. 🔍 Gathering information from trusted sources\n3. 🎯 Verifying and critiquing findings\n4. ✍️ Writing a comprehensive report\n5. ✅ Reviewing for accuracy and clarity\n\nYou'll receive the complete report shortly!`,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, assistantMessage]);
        pollReportStatus(reportId, topic);
        // Don't set isLoading to false here - let polling handle it
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
      setIsLoading(false);
      setCurrentReportStatus(null);
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
        // Don't immediately fail on first error - could be a transient issue
        // Only fail after multiple consecutive errors
        if (attempts >= 3) {
          const errorMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Failed to check report status: ${response.message}`,
            timestamp: new Date()
          };
          setMessages((prev) => [...prev, errorMessage]);
          setIsLoading(false);
          setCurrentReportId(null);
          setCurrentReportStatus(null);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
        return;
      }

      const report = response.content;

      // Update status indicator
      setCurrentReportStatus(report.status as ReportStatus);

      if (report.status === 'COMPLETED' && report.finalReport) {
        const reportMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `# Research Report: ${topic}\n\n${report.finalReport}`,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, reportMessage]);
        setIsLoading(false);
        setCurrentReportId(null);
        setCurrentReportStatus(null);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } else if (report.status === 'FAILED') {
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Report generation failed: ${report.errorMessage || 'Unknown error'}`,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
        setCurrentReportId(null);
        setCurrentReportStatus(null);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } else if (report.status === 'CANCELLED') {
        // Report was cancelled - already have the message, just stop polling
        setIsLoading(false);
        setCurrentReportId(null);
        setCurrentReportStatus(null);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } else if (attempts < maxAttempts) {
        // Continue polling - interval is already set
      } else {
        const timeoutMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Report generation is taking longer than expected. Please check back later.',
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, timeoutMessage]);
        setIsLoading(false);
        setCurrentReportId(null);
        setCurrentReportStatus(null);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    };

    // Initial poll
    poll();
    // Set up interval for subsequent polls
    pollingIntervalRef.current = setInterval(poll, 5000);
  };

  const handleSelectPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const handleCancelReport = async () => {
    if (!currentReportId) return;

    try {
      const { fetcher } = await import('@/packages/lib/helpers/fetcher');
      const { API_REPORTS_CANCEL_ROUTE } = await import('@/packages/lib/routes');

      // Clear polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      // Call cancel API
      const response = await fetcher({
        url: API_REPORTS_CANCEL_ROUTE(currentReportId),
        requestBody: {}
      });

      if (response.err) {
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Failed to cancel report: ${response.message}`,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        const cancelMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Report generation has been cancelled.',
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, cancelMessage]);
      }

      // Clear loading state
      setIsLoading(false);
      setCurrentReportId(null);
      setCurrentReportStatus(null);
      setCurrentTopic('');
    } catch (error) {
      console.error('Error cancelling report:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Failed to cancel report. Please try again.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
      setCurrentReportId(null);
      setCurrentReportStatus(null);
    }
  };

  return (
    <>
      <div className="space-y-6 pb-24">
        {messages.length === 0 ? (
          <div className="min-h-[500px] flex items-center justify-center">
            <EmptyState onSelectPrompt={handleSelectPrompt} />
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Sticky input at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm py-4 ml-64">
        <div className="container mx-auto px-4 max-w-4xl">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 bg-muted/50 border border-border rounded-xl p-2 dark:focus-within:border-white focus-within:border-black transition-all duration-200">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter your research topic..."
                disabled={isLoading}
                className="flex-1 h-10 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-muted-foreground/70"
              />
              {isLoading ? (
                <Button type="button" onClick={handleCancelReport} variant="destructive" size="icon" className="size-10 rounded-lg shrink-0">
                  <X className="size-4" />
                  <span className="sr-only">Cancel report</span>
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="size-10 rounded-lg shrink-0">
                  <Send className="size-4" />
                  <span className="sr-only">Send message</span>
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Status Indicator - Fixed position */}
      {currentReportStatus && <ReportStatusIndicator status={currentReportStatus} topic={currentTopic} />}
    </>
  );
}

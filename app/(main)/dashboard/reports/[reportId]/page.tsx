'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { fetcher } from '@/packages/lib/helpers/fetcher';
import { API_REPORTS_GET_ROUTE } from '@/packages/lib/routes';
import { HttpMethods } from '@/packages/lib/constants/http-methods';
import { Message, MessageBubble } from '@/packages/lib/components/message-bubble';

interface Report {
  id: string;
  topic: string;
  status: string;
  finalReport: string | null;
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  researchPlan: any;
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  findings: any;
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  critique: any;
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  reportMetadata: any;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { icon: CheckCircle2, text: 'Completed', className: 'bg-green-500/10 text-green-500 border-green-500/20' };
      case 'FAILED':
        return { icon: XCircle, text: 'Failed', className: 'bg-red-500/10 text-red-500 border-red-500/20' };
      case 'PENDING':
        return { icon: Clock, text: 'Pending', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
      case 'PLANNING':
        return { icon: Loader2, text: 'Planning', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
      case 'RESEARCHING':
        return { icon: Loader2, text: 'Researching', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
      case 'CRITIQUING':
        return { icon: Loader2, text: 'Critiquing', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
      case 'WRITING':
        return { icon: Loader2, text: 'Writing', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
      case 'REVIEWING':
        return { icon: Loader2, text: 'Reviewing', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
      default:
        return { icon: Clock, text: status, className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  const isLoading = ['PENDING', 'PLANNING', 'RESEARCHING', 'CRITIQUING', 'WRITING', 'REVIEWING'].includes(status);

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${config.className}`}>
      <Icon className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
      {config.text}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="max-w-xl w-full text-center space-y-4">
        <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-foreground/5 border border-border">
          <Sparkles className="size-8 text-foreground/70" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-balance">Report in Progress</h2>
          <p className="text-muted-foreground text-balance">Your research report is being generated. Check back shortly for the complete analysis.</p>
        </div>
      </div>
    </div>
  );
}

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params.reportId as string;
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
    // Poll for updates if report is in progress
    const interval = setInterval(() => {
      if (report?.status && !['COMPLETED', 'FAILED'].includes(report.status)) {
        fetchReport();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [reportId, report?.status]);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const response = await fetcher({
        url: API_REPORTS_GET_ROUTE(reportId),
        method: HttpMethods.GET
      });

      if (response.err) {
        setError('Failed to load report');
      } else {
        setReport(response.content);
      }
    } catch (err) {
      setError('Failed to load report');
      console.error('Error fetching report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading && !report) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <XCircle className="size-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold">Failed to load report</h3>
          <p className="text-sm text-muted-foreground">{error || 'Report not found'}</p>
        </div>
      </div>
    );
  }

  // Convert report data to message format for display
  const messages: Message[] = [
    {
      id: '1',
      role: 'user',
      content: report.topic,
      timestamp: new Date(report.createdAt)
    }
  ];

  if (report.finalReport) {
    messages.push({
      id: '2',
      role: 'assistant',
      content: `# Research Report: ${report.topic}\n\n${report.finalReport}`,
      timestamp: report.completedAt ? new Date(report.completedAt) : new Date()
    });
  } else if (report.status === 'FAILED') {
    messages.push({
      id: '2',
      role: 'assistant',
      content: `Report generation failed: ${report.errorMessage || 'Unknown error'}`,
      timestamp: new Date()
    });
  }

  const hasContent = report.finalReport || report.status === 'FAILED';

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto px-4 pt-[84px] pb-6 max-w-4xl">
        {/* Report Header */}
        <div className="mb-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center justify-between w-full">
              <h1 className="text-2xl font-semibold tracking-tight truncate">{report.topic}</h1>
              <StatusBadge status={report.status} />
            </div>
          </div>
          <div className="flex items-center justify-between w-full mt-2">
            <p className="text-sm text-muted-foreground">Created {formatDate(report.createdAt)}</p>
            {report.completedAt && <p className="text-sm text-muted-foreground">Completed {formatDate(report.completedAt)}</p>}
          </div>
        </div>

        {/* Report Content */}
        <div className="rounded-xl min-h-[600px] max-h-[800px]">
          <div className="flex flex-col min-h-[550px]">
            <div className="flex-1 overflow-y-auto">
              {!hasContent ? (
                <EmptyState />
              ) : (
                <div className="p-6 space-y-6 max-w-3xl mx-auto overflow-x-hidden">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

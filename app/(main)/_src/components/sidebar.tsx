'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CirclePlus } from 'lucide-react';
import { Button } from '@/packages/lib/components/button';
import { fetcher } from '@/packages/lib/helpers/fetcher';
import { API_REPORTS_LIST_ROUTE } from '@/packages/lib/routes';
import { HttpMethods } from '@/packages/lib/constants/http-methods';

interface Report {
  id: string;
  topic: string;
  status: string;
  createdAt: string;
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await fetcher({
        url: API_REPORTS_LIST_ROUTE,
        method: HttpMethods.GET
      });
      setReports(response.content || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-500/70';
      case 'FAILED':
        return 'text-red-500/70';
      case 'PENDING':
      case 'PLANNING':
      case 'RESEARCHING':
      case 'CRITIQUING':
      case 'WRITING':
      case 'REVIEWING':
        return 'text-yellow-500/70';
      default:
        return 'text-gray-500/70';
    }
  };

  const getStatusBorderAndBg = (status: string) => {
    switch (status) {
      default:
        return 'border-gray-500/40 bg-gray-500/5 hover:bg-gray-500/15 transition-all duration-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleReportClick = (reportId: string) => {
    router.push(`/dashboard/reports/${reportId}`);
  };

  return (
    <div className="w-64 bg-card border-r border-border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Button onClick={() => router.push('/dashboard')} className="w-full">
          <CirclePlus className="size-4" />
          New chat
        </Button>
      </div>

      {/* Reports List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">No reports yet. Start a new research to see it here!</div>
        ) : (
          <div className="p-2">
            {reports.map((report) => (
              <Button
                key={report.id}
                variant="ghost"
                onClick={() => handleReportClick(report.id)}
                className={`w-full justify-start h-auto p-3 mb-2 border ${getStatusBorderAndBg(report.status)} ${
                  pathname === `/dashboard/reports/${report.id}` ? 'ring-2 ring-accent' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate" title={report.topic}>
                      {report.topic}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs ${getStatusColor(report.status)}`}>{report.status}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(report.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { ResearchChat } from './_src/components/research-chat';
import { CreditCard, Star, FileText } from 'lucide-react';
import { getUser } from '@/packages/lib/helpers/supabase/auth';
import { handleUnauthorized } from '@/packages/lib/helpers/api-response-handlers';
import { db } from '@/packages/lib/prisma/prisma-client';

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
      <div className="size-10 rounded-lg bg-foreground/5 flex items-center justify-center">
        <Icon className="size-5 text-foreground/60" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-xl font-semibold tracking-tight capitalize">{value}</p>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const currentUser = await getUser();

  if (!currentUser) {
    return handleUnauthorized();
  }

  let reports = [];
  try {
    reports = await db.report.findMany({
      where: {
        userId: currentUser.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        topic: true,
        status: true,
        createdAt: true
      }
    });
  } catch (error) {
    console.error('Failed to fetch reports:', error);
  }

  return (
    <div className="bg-background h-full overflow-y-auto">
      <div className="container mx-auto px-4 pt-[20px] pb-6 max-w-4xl min-h-full">
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Credits" value={currentUser.credits} icon={CreditCard} />
          <StatCard label="Subscription" value={currentUser.subscriptionTier} icon={Star} />
          <StatCard label="Reports" value={reports.length} icon={FileText} />
        </div>

        <ResearchChat />
      </div>
    </div>
  );
}

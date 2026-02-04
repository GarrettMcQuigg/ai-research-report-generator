import React from 'react';
import { ResearchChat } from './_src/components/research-chat';
import { CreditCard, Star, FileText } from 'lucide-react';

// Mock user data - replace with actual auth
const user = {
  credits: 250,
  subscriptionTier: 'pro',
  reports: 12
};

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

export default function DashboardPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-28 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Credits" value={user.credits} icon={CreditCard} />
          <StatCard label="Subscription" value={user.subscriptionTier} icon={Star} />
          <StatCard label="Reports" value={user.reports} icon={FileText} />
        </div>

        <div className="rounded-lg min-h-full max-h-[1000px] overflow-hidden">
          <ResearchChat />
        </div>
      </div>
    </div>
  );
}

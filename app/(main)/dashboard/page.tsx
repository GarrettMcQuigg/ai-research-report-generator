import { getUser } from '@/packages/lib/helpers/supabase/auth';

export default async function DashboardPage() {
  const user = await getUser();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name || 'User'}!</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Credits Card */}
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Available Credits</h3>
            <p className="text-3xl font-bold">{user.credits}</p>
          </div>

          {/* Subscription Card */}
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Subscription</h3>
            <p className="text-3xl font-bold capitalize">{user.subscriptionTier}</p>
          </div>

          {/* Reports Card */}
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Reports Generated</h3>
            <p className="text-3xl font-bold">0</p>
          </div>
        </div>

        <div className="mt-8 border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <p className="text-muted-foreground mb-4">
            Welcome to the AI Research Report Generator! This platform helps you create comprehensive research reports using AI-powered agents.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Each report generation costs 1 credit</p>
            <p>• You currently have {user.credits} credits available</p>
            <p>• Reports are generated using a multi-agent workflow</p>
          </div>
        </div>
      </div>
    </div>
  );
}

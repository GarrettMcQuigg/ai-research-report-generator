import { DASHBOARD_ROUTE } from '@/packages/lib/routes';
import { UserDropdown } from './user-dropdown';
import Link from 'next/link';

export function DashboardHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={DASHBOARD_ROUTE}>
            <h1 className="text-xl font-bold">AI Research Report Generator</h1>
          </Link>
        </div>

        <nav className="flex items-center gap-4">
          <UserDropdown />
        </nav>
      </div>
    </header>
  );
}

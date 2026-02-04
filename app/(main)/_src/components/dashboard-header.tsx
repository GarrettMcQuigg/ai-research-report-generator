import { UserDropdown } from './user-dropdown';

export function DashboardHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">AI Research Generator</h1>
        </div>

        <nav className="flex items-center gap-4">
          <UserDropdown />
        </nav>
      </div>
    </header>
  );
}

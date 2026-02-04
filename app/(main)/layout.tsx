import { DashboardHeader } from './_src/components/dashboard-header';
import { Sidebar } from './_src/components/sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[100vh] overflow-hidden flex flex-col">
      <DashboardHeader />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

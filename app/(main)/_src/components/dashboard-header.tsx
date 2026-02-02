'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/packages/lib/components/button';
import { createClient } from '@/packages/lib/supabase/client';
import { AUTH_SIGNIN_ROUTE } from '@/packages/lib/routes';

export function DashboardHeader() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push(AUTH_SIGNIN_ROUTE);
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">AI Research Generator</h1>
        </div>

        <nav className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleSignOut} disabled={isSigningOut}>
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </Button>
        </nav>
      </div>
    </header>
  );
}

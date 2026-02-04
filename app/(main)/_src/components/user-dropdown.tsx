'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { Button } from '@/packages/lib/components/button';
import { ThemeToggle } from '@/app/(landing)/_src/components/theme-toggle';
import { createClient } from '@/packages/lib/supabase/client';
import { AUTH_SIGNIN_ROUTE } from '@/packages/lib/routes';

export function UserDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
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
    <div className="relative">
      {/* Dropdown Trigger */}
      <Button variant="ghost" onClick={() => setIsOpen(!isOpen)} className="gap-2">
        <User className="size-4" />
        <ChevronDown className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            {/* Theme Toggle */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-medium">Theme</span>
              <ThemeToggle />
            </div>

            {/* Logout */}
            <Button variant="ghost" onClick={handleSignOut} disabled={isSigningOut} className="w-full justify-start px-4 py-3 rounded-none hover:bg-accent bg-red-700 text-white">
              <LogOut className="size-4 mr-2" />
              {isSigningOut ? 'Signing out...' : 'Logout'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

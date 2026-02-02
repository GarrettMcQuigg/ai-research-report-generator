'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { MoonIcon, SunIcon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with the same dimensions to avoid layout shift
    return <div className="h-5 w-5" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      className="bg-transparent cursor-pointer transition-all duration-200 hover:scale-110"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <MoonIcon
          className="h-5 w-5 text-foreground hover:text-muted-foreground transition-colors duration-200"
          aria-hidden="true"
        />
      ) : (
        <SunIcon
          className="h-5 w-5 text-foreground hover:text-muted-foreground transition-colors duration-200"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

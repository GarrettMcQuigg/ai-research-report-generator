import { AUTH_SIGNIN_ROUTE, AUTH_SIGNUP_ROUTE } from '@/packages/lib/routes';
import Link from 'next/link';
import { ThemeToggle } from './_src/components/theme-toggle';
import { Button } from '@/packages/lib/components/button';

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-foreground">
                ResearchAI<span className="text-primary">.report</span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex md:space-x-8">
              <Link
                href="/pricing"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/docs"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Documentation
              </Link>
            </nav>

            {/* Auth buttons + Theme toggle */}
            <div className="flex items-center space-x-8">
              <Link
                href={AUTH_SIGNIN_ROUTE}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link href={AUTH_SIGNUP_ROUTE}>
                <Button>Get Started</Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Product</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    href="/pricing"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Company</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Blog
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-8">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} ResearchAI.report. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

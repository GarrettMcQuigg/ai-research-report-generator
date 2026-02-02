import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Providers } from '@/packages/lib/providers/providers';
import { cn } from '@/packages/lib/utils';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  preload: false
});

export const metadata: Metadata = {
  title: 'AI Research Report Generator',
  description: 'Generate comprehensive research reports using AI'
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased', geistSans.variable)} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

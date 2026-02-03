'use client';

import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
// import { ToastContainer, Bounce } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import NextTopLoader from 'nextjs-toploader';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <SpeedInsights />
      {/* <NextTopLoader color="#0062EA" initialPosition={0.08} showSpinner={false} height={4} shadow="0 0 10px #0062EA,0 0 5px #0062EA" /> */}

      {/* <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        transition={Bounce}
      /> */}

      {children}

      <Analytics />
    </ThemeProvider>
  );
}

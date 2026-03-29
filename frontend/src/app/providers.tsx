'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#18181b',
            color: '#fafafa',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: '500',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fafafa' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fafafa' } },
        }}
      />
    </QueryClientProvider>
  );
}

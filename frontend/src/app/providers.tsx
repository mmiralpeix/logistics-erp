'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { ThemeProvider } from '@/lib/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 60 * 1000, // 10 minutos de frescura en memoria (Navegación instantánea a 0ms)
            gcTime: 60 * 60 * 1000, // 60 minutos de retención en memoria
            refetchOnWindowFocus: false, // Evitar peticiones en segundo plano
            refetchOnReconnect: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155' },
            success: { iconTheme: { primary: '#10B981', secondary: '#F1F5F9' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#F1F5F9' } },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

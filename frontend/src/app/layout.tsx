import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'LogisticsPro ERP',
  description: 'Sistema de Gestión Logística Empresarial',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="bg-slate-900 text-slate-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

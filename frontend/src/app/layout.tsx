import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'PassPorto — Layanan Paspor Digital Indonesia',
  description: 'Sistem permohonan paspor modern dengan verifikasi NIK, booking slot real-time, dan pelacakan status digital.',
  keywords: ['paspor', 'imigrasi', 'layanan digital', 'KTP', 'NIK', 'passport Indonesia'],
  openGraph: {
    title: 'PassPorto',
    description: 'Permohonan paspor Indonesia yang mudah, cepat, dan transparan.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="noise-overlay" aria-hidden="true" />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

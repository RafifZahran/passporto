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
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

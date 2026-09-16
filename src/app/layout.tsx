import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Parkmind — Le pilote automatique du stationnement urbain',
    template: '%s · Parkmind',
  },
  description:
    'Parkmind automatise votre stationnement urbain récurrent. Configurez une fois, ne pensez plus jamais à votre ticket.',
  applicationName: 'Parkmind',
  authors: [{ name: 'Parkmind' }],
  keywords: [
    'stationnement',
    'parking',
    'automatisation',
    'résident',
    'Paris',
    'PayByPhone',
  ],
  openGraph: {
    title: 'Parkmind — Le pilote automatique du stationnement urbain',
    description:
      'Ne pensez plus jamais à votre ticket de stationnement. Parkmind s’en charge.',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1a1f' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Non-blocking: falls back to the system font stack if unavailable. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

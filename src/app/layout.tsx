import type { Metadata, Viewport } from 'next';
import './tailwind.css';
import './globals.css';
import { site } from '@/data/site';

export const metadata: Metadata = {
  title: { default: `${site.name} · ${site.role}`, template: `%s · ${site.name}` },
  description: site.description,
  // a design test: keep it out of search results
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#1a1917',
  colorScheme: 'dark',
};

/** The public site is light only (see its layout); the admin follows html[data-theme], which stays dark. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/SuisseIntl-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/SuisseIntl-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}

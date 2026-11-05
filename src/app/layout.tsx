import type { Metadata, Viewport } from 'next';
import './tailwind.css';
import './globals.css';
import { site } from '@/data/site';

const shareImage = { url: '/og.png', width: 1200, height: 630, alt: `${site.name}, product designer` };

export const metadata: Metadata = {
  metadataBase: new URL('https://www.alexneto.com'), // the apex redirects here; image URLs point straight at it so crawlers skip the hop
  title: { default: `${site.name} · ${site.role}`, template: `%s · ${site.name}` },
  description: site.description,
  // the link preview on socials and messaging apps (the image is designed in Figma: website-2027 › Concept › Share image)
  openGraph: {
    type: 'website',
    siteName: site.name,
    title: `${site.name} · ${site.role}`,
    description: site.description,
    images: [shareImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} · ${site.role}`,
    description: site.description,
    images: [shareImage.url],
  },
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

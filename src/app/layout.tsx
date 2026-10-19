import type { Metadata, Viewport } from 'next';
import './tailwind.css';
import './globals.css';
import { Nav } from '@/components/Nav';
import { SmoothScroll } from '@/components/SmoothScroll';
import { Wordmark } from '@/components/Wordmark';
import { site } from '@/data/site';

export const metadata: Metadata = {
  title: { default: `${site.name} · ${site.role} (v2 test)`, template: `%s · ${site.name}` },
  description: site.description,
  // a design test: keep it out of search results
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f5' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0c0c' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* apply the stored theme (else the system one) before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}",
          }}
        />
        <link rel="preload" href="/fonts/SuisseIntl-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/SuisseIntl-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <SmoothScroll />
        <Nav />
        <Wordmark />
        <main>{children}</main>
      </body>
    </html>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/** The public site's chrome (nav, wordmark, smooth scroll) is not part of the back office. */
export function ChromeGate({ children }: { children: ReactNode }) {
  return usePathname().startsWith('/admin') ? null : <>{children}</>;
}

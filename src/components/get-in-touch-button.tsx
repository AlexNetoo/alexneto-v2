import Link from 'next/link';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/** The pill that the useLayouts Get in touch effect lives in; dark = the site's inverted colours (light/dark aware). */
export function PrimaryCtaLink({ className, variant = 'dark', href, ...props }: Omit<ComponentProps<'a'>, 'href'> & { href: string; variant?: 'dark' }) {
  const external = /^https?:/.test(href);
  return (
    <Link
      href={href}
      className={cn('gt-btn relative inline-flex items-center justify-center', variant === 'dark' && 'gt-btn--dark', className)}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...props}
    />
  );
}

import { tokens } from '@/halaska-kit';

/**
 * The site's dark theme is darker than the kit's default (#1a1a1a). Kit components read these tokens at render
 * time, so overriding them once, before anything renders, keeps them matching the CSS variables in globals.css.
 * Imported (for the side effect) by KitProvider and AdminProviders.
 */
Object.assign(tokens.dark, {
  bg: '#0c0c0c',
  bgElevated: '#1a1a1a',
  bgSubtle: '#141414',
  bgMuted: '#1f1f1f',
  bgHover: '#292929',
  bgInput: '#161616',
  border: '#2a2a2a',
  borderSubtle: '#202020',
  borderFocus: '#d0d0d0',
  text: '#e6e6e6',
  textSecondary: '#9a9a9a',
  textTertiary: '#6a6a6a',
  textMuted: '#4a4a4a',
  textInverse: '#0c0c0c',
});

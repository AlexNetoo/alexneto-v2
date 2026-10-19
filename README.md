# alexneto-v2 (design test)

A separate project for trying the new alexneto.com design from Figma
(`Bl661mBnZ5oPb3dy9B08R7`, page "Page 10": 1920px Work). It shares nothing with the live site:
no admin, no storage, no keys, no deploy hooks. The live site is `../alexneto-site`.

## Run

Needs Node 20+.

```bash
npm install
npm run dev      # http://localhost:3200
npm run build && npm start
```

## What is here

- **Home** (`/`): statement, then a huge ALEX NETO wordmark along the bottom of the first screen. Scrolling
  shrinks and docks it at the top centre (scrubs both ways) while the project grid rises beneath it.
  `src/components/Wordmark.tsx` holds the geometry (all numbers come from the Figma file).
- **Project cards**: 565 x 748 portrait cards from the Figma file. On hover they cycle through the project's
  own images and a liquid gradient (useLayouts `liquid-index` canvas) washes over them.
- **About** (`/about`): the same language. Résumé uses useLayouts `discrete-tabs` and `liquid-index`.
- **Project pages** (`/projects/[slug]`): minimal, not in the Figma file yet.
- **Content**: the live site's seven projects, copied once into `src/data/projects.snapshot.json`
  (remote images are the same Vercel Blob files, local ones are in `public/projects`). Copy lives in
  `src/data/site.ts`.
- **Assets from Figma**: `public/avatar.png`, `public/alex-neto-wordmark.svg`.
- Light theme only for now. Fonts: Suisse Int'l (Regular / Book / Medium).
- `robots: noindex`, so a deploy of this will not show up in search.

## Adding more useLayouts components

`npx shadcn@latest add @uselayouts/<name>` (registry is in `components.json`). Tailwind runs utilities-only
(`src/app/tailwind.css`, no preflight), mapped onto the CSS variables in `globals.css`.

import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 828, 1080, 1440, 1920, 2400],
    imageSizes: [96, 192, 320, 480, 640],
    qualities: [70, 75, 80, 82],
    // the projects' images live in the same Vercel Blob store as alexneto.com
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
  },
};

export default nextConfig;

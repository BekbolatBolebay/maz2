import withPWAInit from 'next-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  customWorkerDir: 'worker',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: __dirname,
  experimental: {
    // This helps Next.js find the correct root in CI environments like Vercel
    // specifically when multiple lockfiles or parent directories are present.
  },
  // This silences the "Turbopack with Webpack config" error in Next.js 15/16
  turbopack: {},
}

const finalConfig = withPWA(nextConfig);

// Double ensure turbopack is disabled if configured via plugin
if (finalConfig) {
  finalConfig.turbopack = {};
}

export default finalConfig;

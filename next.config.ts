import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB'],
  },
  eslint: {
    // Temporarily disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporarily disable TypeScript errors during production builds
    ignoreBuildErrors: true,
  },
};

// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);

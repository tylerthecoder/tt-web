const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const isDev = process.env.NODE_ENV === 'development';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['i.scdn.co', 'files.tylertracy.com'],
  },
  output: 'standalone',
  transpilePackages: ['tt-services'],
  outputFileTracingRoot: isDev ? path.join(__dirname, '..') : undefined,
  async redirects() {
    return [{ source: '/panel', destination: '/daily', permanent: false }];
  },
};

module.exports = withBundleAnalyzer(nextConfig);

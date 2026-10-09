const path = require('node:path');

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.scdn.co' },
      { protocol: 'https', hostname: 'files.tylertracy.com' },
    ],
  },
  output: 'standalone',
  transpilePackages: ['tt-services'],
  turbopack: { root: path.resolve(__dirname) },
  async redirects() {
    return [{ source: '/panel', destination: '/daily', permanent: false }];
  },
};

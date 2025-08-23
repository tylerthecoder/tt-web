/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  reactStrictMode: true,
  images: {
    domains: ["i.scdn.co", "files.tylertracy.com"],
  },
  output: "standalone",
  transpilePackages: ["tt-services"],
  webpack: (config) => {
    config.resolve.fallback = {
      "mongodb-client-encryption": false,
      "aws4": false

    };

    return config;
  },
  async redirects() {
    return [
      // Notes to panel
      { source: '/notes', destination: '/panel/notes', permanent: false },
      { source: '/notes/:id', destination: '/panel/note/:id/view', permanent: false },
      { source: '/notes/:id/edit', destination: '/panel/note/:id/edit', permanent: false },
      // Lists to panel
      { source: '/lists', destination: '/panel/lists', permanent: false },
      { source: '/lists/:id', destination: '/panel/list/:id', permanent: false },
      // Panel default subroutes
      { source: '/panel', destination: '/panel/daily', permanent: false },
    ]
  }
});

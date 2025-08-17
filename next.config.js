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
  }
});

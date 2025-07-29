/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    domains: ["i.scdn.co", "files.tylertracy.com"],
  },
  output: "standalone",
  transpilePackages: ["tt-services"],
  experimental: {
    scrollRestoration: false,
  },
};

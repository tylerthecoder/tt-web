/** @type {import('next').NextConfig} */
module.exports = {
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
};

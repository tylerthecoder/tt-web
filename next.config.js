/** @type {import('next').NextConfig} */
module.exports = {
  webpack(config) {
    config.resolve.alias['prosemirror-model'] = require.resolve('prosemirror-model')
    return config
  },
  reactStrictMode: true,
  images: {
    domains: ["i.scdn.co", "files.tylertracy.com"],
  },
  output: "standalone",
  transpilePackages: ["tt-services"],
};

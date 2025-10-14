/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    typedRoutes: false,
    serverActions: false
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.farlabs.ai'
      }
    ]
  }
};

module.exports = nextConfig;

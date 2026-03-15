import type { NextConfig } from 'next'

const API_URL = process.env.API_URL ?? 'http://localhost:3333'

const nextConfig: NextConfig = {
  transpilePackages: ['@mykb/shared'],

  images: {
    remotePatterns: [
      { hostname: 'lh3.googleusercontent.com' },
      { hostname: 's.gravatar.com' },
      { hostname: 'cdn.auth0.com' },
    ],
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ]
  },
}

export default nextConfig

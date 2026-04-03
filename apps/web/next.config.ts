import type { NextConfig } from 'next'

const API_URL = process.env.API_URL ?? 'http://localhost:3333'

const nextConfig: NextConfig = {
  transpilePackages: ['@mykb/shared'],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 's.gravatar.com', pathname: '/avatar/**' },
      { protocol: 'https', hostname: 'cdn.auth0.com', pathname: '/avatars/**' },
    ],
  },

  async rewrites() {
    // In production, Caddy handles /api/* routing directly to the API server.
    // The rewrite is only needed in development where Next.js proxies to the API.
    if (process.env.NODE_ENV === 'production') return []
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ]
  },
}

export default nextConfig

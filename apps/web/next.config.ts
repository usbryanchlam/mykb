import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@mykb/shared'],

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3333/api/:path*',
      },
    ]
  },
}

export default nextConfig

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typedRoutes: false,
  experimental: {
    optimizePackageImports: ['recharts'],
  },
}
export default nextConfig

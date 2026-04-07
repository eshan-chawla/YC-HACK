/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Prevent Convex-generated files from triggering unnecessary HMR cycles (Turbopack)
  turbopack: {
    watchOptions: {
      ignoredDirectories: ['convex/_generated'],
    },
  },
}

export default nextConfig

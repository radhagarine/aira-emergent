/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'hebbkx1anhila5yf.public.blob.vercel-storage.com',
      'lh3.googleusercontent.com',
      'avatars.googleusercontent.com',
      'googleusercontent.com'
    ],
  },
  experimental: {
    // Increase server timeout to handle slow Supabase queries
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  // Increase timeout for undici (Node 24 compatibility)
  serverRuntimeConfig: {
    connectTimeout: 60000,
    keepAliveTimeout: 65000,
  },
}

module.exports = nextConfig


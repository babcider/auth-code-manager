/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  webpack: (config) => {
    config.watchOptions = {
      ignored: ['node_modules/**', '**/supabase/functions/**']
    };
    return config;
  }
}

module.exports = nextConfig 
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
      ...config.watchOptions,
      ignored: [
        ...(config.watchOptions?.ignored || []),
        '**/supabase/functions/**'
      ]
    };
    return config;
  }
}

module.exports = nextConfig 
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  webpack: (config, { isServer }) => {
    // Supabase Edge Functions 디렉토리 제외
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [...(config.watchOptions?.ignored ?? []), '**/supabase/functions/**']
    };
    return config;
  }
}

module.exports = nextConfig 
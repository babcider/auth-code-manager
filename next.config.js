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
    // 기존 watchOptions가 없으면 빈 객체로 초기화
    if (!config.watchOptions) {
      config.watchOptions = {};
    }
    // 기존 ignored가 없으면 빈 배열로 초기화
    if (!config.watchOptions.ignored) {
      config.watchOptions.ignored = [];
    }
    // ignored가 배열이 아니면 배열로 변환
    if (!Array.isArray(config.watchOptions.ignored)) {
      config.watchOptions.ignored = [config.watchOptions.ignored];
    }
    // Supabase functions 디렉토리 추가
    config.watchOptions.ignored.push('**/supabase/functions/**');
    return config;
  }
}

module.exports = nextConfig 
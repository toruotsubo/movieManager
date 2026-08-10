/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  assetPrefix: './',
  images: {
    unoptimized: true,
  },
  // 静的出力時のトレイル化
  trailingSlash: true,
};

export default nextConfig;

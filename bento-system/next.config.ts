/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    appIsrStatus: false, // Next.js 15用
    buildActivity: false, // 古いバージョン用
  },
};

export default nextConfig;
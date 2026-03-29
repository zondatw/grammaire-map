import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development'

const nextConfig: NextConfig = {
  output: isDev ? undefined : 'export',
  assetPrefix: isDev ? undefined : (process.env.ASSET_PREFIX ?? './'),
};

export default nextConfig;

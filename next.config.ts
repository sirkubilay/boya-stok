import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  allowedDevOrigins: ['192.168.1.7', '192.168.1.*'],
};

export default nextConfig;

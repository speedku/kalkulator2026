import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/kalkulator2026",
  output: "standalone",
  reactStrictMode: true,
  serverExternalPackages: ["bcryptjs", "mssql"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "minio.allbag.pl",
      },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Electron için export kaldırıldı
  // output: 'export', // Bu satırı kaldır
  // trailingSlash: true, // Bu satırı kaldır
  
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
        pathname: '**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Electron için headers konfigürasyonu
  async headers() {
    return [
      {
        source: '/embed/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'microphone=*, camera=*, display-capture=*'
          }
        ]
      },
      {
        source: '/api/vapi/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ]
      }
    ];
  }
};

export default nextConfig; 
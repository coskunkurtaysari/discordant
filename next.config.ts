import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Electron için export kaldırıldı
  // output: 'export', // Bu satırı kaldır
  // trailingSlash: true, // Bu satırı kaldır
  
  // Log seviyesini azalt
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
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
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' http://localhost:3000 https://localhost:3000 https://*.clerk.accounts.dev https://*.clerk.com https://clerk-telemetry.com https://*.js.stripe.com https://js.stripe.com https://maps.googleapis.com https://api.stripe.com https://cdn.jsdelivr.net https://js.sentry-cdn.com https://browser.sentry-cdn.com https://*.sentry.io https://challenges.cloudflare.com https://scdn.clerk.com https://segapi.clerk.com https://*.cloudflare.com https://turnstile.cloudflare.com https://challenges.cloudflare.com https://*.cloudflare.com https://*.turnstile.cloudflare.com https://*.uploadthing.com https://*.ingest.uploadthing.com https://sea1.ingest.uploadthing.com; frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://*.cloudflare.com https://turnstile.cloudflare.com https://challenges.cloudflare.com https://*.turnstile.cloudflare.com; img-src 'self' data: blob: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://cdn.jsdelivr.net https://js.sentry-cdn.com https://browser.sentry-cdn.com https://*.sentry.io https://challenges.cloudflare.com https://scdn.clerk.com https://segapi.clerk.com https://*.cloudflare.com https://turnstile.cloudflare.com https://challenges.cloudflare.com https://*.turnstile.cloudflare.com; style-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com; worker-src 'self' blob:; child-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self';"
          }
        ]
      },
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
import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https://images.unsplash.com https://res.cloudinary.com https://*.google.com https://*.googleapis.com https://*.arcgisonline.com https://*.openstreetmap.org https://*.cartocdn.com;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' https://*.pusher.com wss://*.pusher.com https://*.sentry.io https://res.cloudinary.com https://api.resend.com https://*.google.com https://*.arcgisonline.com https://*.openstreetmap.org;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
`
  .replace(/\s{2,}/g, ' ')
  .trim();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: [
    "192.168.1.92",
    "localhost:3000",
    "127.0.0.1:3000",
    "*.trycloudflare.com",
    "trycloudflare.com",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

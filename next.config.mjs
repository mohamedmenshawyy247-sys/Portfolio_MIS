import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // src/app/global-not-found.tsx: a full document for URLs that match no route (the root layout lives in the
  // dynamic [locale] segment and cannot be reused for them). Experimental flag in Next 16.4; file-based only.
  experimental: { globalNotFound: true },
  poweredByHeader: false,
  // Do NOT add output: 'export': Payload Admin/DB needs a server.
  images: {
    remotePatterns: [],
    // Only public uploads may pass through the image optimizer. Private media is never optimised
    // or referenced by public pages.
    localPatterns: [{ pathname: '/api/public-media/file/**' }],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      { source: '/preview', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
      { source: '/exit-preview', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ]
  },
}

export default withPayload(nextConfig)

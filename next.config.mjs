import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig = {
  reactStrictMode: true,
  // Do NOT add output: 'export': Payload Admin/DB needs a server.
  images: { remotePatterns: [] },
}

export default withPayload(nextConfig)

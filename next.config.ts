import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    // Vercel meters next/image's built-in optimization (resize + WebP
    // conversion, served through /_next/image) against the plan's monthly
    // allowance — once that's exhausted, Vercel returns 402 for EVERY
    // /_next/image request instead of degrading gracefully, which takes
    // every <Image> on the site down at once (confirmed live: the raw file
    // at /api/media/file/... still returned 200 the whole time, only the
    // optimizer endpoint was blocked). `unoptimized: true` makes next/image
    // render a plain <img src> pointing straight at the original file,
    // bypassing /_next/image entirely — images are no longer auto-resized/
    // converted to WebP (somewhat larger downloads), but this can never hit
    // that quota again, regardless of traffic or plan.
    unoptimized: true,
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })

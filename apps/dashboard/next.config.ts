import type { NextConfig } from 'next';
import path from 'node:path';
const config: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ['@accordly/core'],
  // The SDK route reads these files at runtime, outside the dashboard app root.
  outputFileTracingRoot: path.join(__dirname, '../..'),
  outputFileTracingIncludes: {
    '/api/*': [
      '../../packages/consent-core/src/**/*.js',
      '../../packages/consent-core/legacy/**/*.js',
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};
export default config;

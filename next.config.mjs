import webpack from 'next/dist/compiled/webpack/webpack-lib.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // pptxgenjs imports node:fs and node:https for server-side file writing.
    // In the browser, it uses Blob download instead, so we can safely stub these.
    if (!isServer) {
      // Rewrite node: protocol imports to regular module names
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:/,
          (resource) => {
            resource.request = resource.request.replace(/^node:/, '');
          }
        )
      );

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        https: false,
        http: false,
        net: false,
        tls: false,
        stream: false,
        zlib: false,
      };
    }
    return config;
  },
};

export default nextConfig;

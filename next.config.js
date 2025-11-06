/** @type {import('next').NextConfig} */
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const projectRoot = __dirname;

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    externalDir: true
  },
  typescript: {
    tsconfigPath: 'tsconfig.json'
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  webpack: (config, { isServer }) => {
    const existingAlias = config.resolve.alias || {};

    config.resolve.alias = {
      ...existingAlias,
      '@/components': path.join(projectRoot, 'app', 'components'),
      '@/lib': path.join(projectRoot, 'app', 'lib'),
      '@': projectRoot
    };

    config.resolve.modules = [
      path.join(projectRoot, 'app'),
      projectRoot,
      ...(config.resolve.modules || [])
    ];

    if (isServer) {
      config.externals = [...(config.externals || []), 'pdfkit'];
    }

    return config;
  }
};

module.exports = nextConfig;

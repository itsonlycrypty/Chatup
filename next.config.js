/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  experimental: {
    esmExternals: 'loose',
  },
  transpilePackages: ['@firebase', 'firebase'],
};

module.exports = nextConfig;

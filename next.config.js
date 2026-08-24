const withTM = require('next-transpile-modules')([
  '@firebase',
  'firebase',
  'undici',
]);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  experimental: {
    esmExternals: 'loose',
  },
};

module.exports = withTM(nextConfig);

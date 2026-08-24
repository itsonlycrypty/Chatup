/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  experimental: {
    esmExternals: 'loose',
  },
  transpilePackages: ['@firebase', 'firebase'],
  webpack: (config, { isServer }) => {
    // Fix for undici module parsing error
    if (!isServer) {
      config.module.rules.push({
        test: /node_modules\/undici\/.*\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      });
    }
    return config;
  },
};

module.exports = nextConfig;

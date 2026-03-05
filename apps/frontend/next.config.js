/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = { ...config.resolve.fallback, canvas: false };
    }
    return config;
  },
};

module.exports = nextConfig;

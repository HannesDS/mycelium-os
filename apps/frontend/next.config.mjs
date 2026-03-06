/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, "canvas"];
    }
    return config;
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["konva", "react-konva"],
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
};

export default nextConfig;

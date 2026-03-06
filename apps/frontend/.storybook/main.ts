import type { StorybookConfig } from "@storybook/react-webpack5";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  typescript: {
    check: false,
    reactDocgen: false,
  },
  webpackFinal: async (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": require("path").resolve(__dirname, "../src"),
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
    };
    config.module = config.module ?? { rules: [] };
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: require.resolve("ts-loader"),
          options: {
            transpileOnly: true,
            configFile: require.resolve("../tsconfig.json"),
            compilerOptions: { jsx: "react-jsx" },
          },
        },
      ],
    });
    config.resolve.extensions = [...(config.resolve.extensions || []), ".ts", ".tsx"];
    return config;
  },
};

export default config;

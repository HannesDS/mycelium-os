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
  webpackFinal: async (config) => {
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
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
      exclude: /node_modules/,
    });
    config.resolve = config.resolve || {};
    config.resolve.extensions = [...(config.resolve.extensions || []), ".ts", ".tsx"];
    return config;
  },
};

export default config;

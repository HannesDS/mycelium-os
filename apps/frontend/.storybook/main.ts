/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const config = {
  stories: ["../**/*.stories.@(js|jsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
};

export default config;

import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@chromatic-com/storybook",
  ],
  framework: "@storybook/nextjs-vite",
  staticDirs: [
    "../public",
    { from: "../app/fonts", to: "/fonts" },
  ],
};
export default config;

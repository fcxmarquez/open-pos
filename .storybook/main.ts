import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/nextjs-vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  viteFinal: async (config) => {
    config.resolve ??= {};
    const newAlias = {
      find: "@/app/actions/admin-dashboard",
      replacement: path.resolve(__dirname, "./mocks/admin-dashboard.ts"),
    };
    const existing = config.resolve.alias;
    config.resolve.alias = Array.isArray(existing)
      ? [...existing, newAlias]
      : { ...(existing ?? {}), "@/app/actions/admin-dashboard": newAlias.replacement };
    return config;
  },
};
export default config;

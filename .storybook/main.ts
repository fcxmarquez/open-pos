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
    const mockAliases = (
      [
        ["@/app/actions/admin-dashboard", "admin-dashboard"],
        ["@/app/actions/session-queries", "session-queries"],
        ["@/app/actions/sessions", "sessions"],
        ["@/db", "db"],
      ] as [string, string][]
    ).map(([find, mockFile]) => ({
      find,
      replacement: path.resolve(__dirname, `./mocks/${mockFile}.ts`),
    }));
    const existing = config.resolve.alias;
    config.resolve.alias = Array.isArray(existing)
      ? [...mockAliases, ...existing]
      : {
          ...Object.fromEntries(mockAliases.map((a) => [a.find, a.replacement])),
          ...(existing ?? {}),
        };
    return config;
  },
};
export default config;

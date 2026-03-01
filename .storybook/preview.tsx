import type { Preview } from "@storybook/nextjs-vite";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "error",
    },
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="font-body">
        <Story />
      </div>
    ),
  ],
};

export default preview;

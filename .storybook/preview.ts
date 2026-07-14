import type { Preview } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";
import React from "react";
import messages from "../messages/es.json";
import "@/app/globals.css";

const preview: Preview = {
  decorators: [
    (Story) =>
      React.createElement(
        NextIntlClientProvider,
        { locale: "es", messages },
        React.createElement(Story)
      ),
  ],
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
};

export default preview;

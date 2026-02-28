import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "@/components/ui/input";

const meta = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "number", "email", "password"],
    },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
} satisfies Meta<typeof Input>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "Escribe aqui..." },
};

export const WithValue: Story = {
  args: { defaultValue: "Cuaderno de notas" },
};

export const NumericInput: Story = {
  args: { type: "number", placeholder: "0.00", step: "0.01" },
};

export const Disabled: Story = {
  args: { placeholder: "Deshabilitado", disabled: true },
};

export const ReadOnly: Story = {
  args: {
    defaultValue: "750123456789",
    readOnly: true,
    className: "bg-muted font-mono",
  },
};

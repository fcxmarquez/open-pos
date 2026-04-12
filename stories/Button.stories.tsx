import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline-solid", "secondary", "ghost", "link"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Button" },
};

export const Destructive: Story = {
  args: { children: "Eliminar", variant: "destructive" },
};

export const Outline: Story = {
  args: { children: "Cancelar", variant: "outline" },
};

export const Secondary: Story = {
  args: { children: "Secundario", variant: "secondary" },
};

export const Ghost: Story = {
  args: { children: "Ghost", variant: "ghost" },
};

export const Link: Story = {
  args: { children: "Link button", variant: "link" },
};

export const Small: Story = {
  args: { children: "Small", size: "sm" },
};

export const Large: Story = {
  args: { children: "Large", size: "lg" },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Plus className="mr-1.5 h-4 w-4" />
        Agregar producto
      </>
    ),
  },
};

export const IconOnly: Story = {
  args: {
    size: "icon",
    variant: "outline",
    children: <Trash2 className="h-4 w-4" />,
    "aria-label": "Eliminar",
  },
};

export const Disabled: Story = {
  args: { children: "Disabled", disabled: true },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small (h-9)</Button>
      <Button size="default">Default (h-10)</Button>
      <Button size="lg">Large (h-11)</Button>
      <Button size="icon" aria-label="Icon">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  ),
};

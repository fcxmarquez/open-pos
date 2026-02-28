import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline"],
    },
  },
} satisfies Meta<typeof Badge>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Badge" },
};

export const Secondary: Story = {
  args: { children: "Secondary", variant: "secondary" },
};

export const Destructive: Story = {
  args: { children: "Error", variant: "destructive" },
};

export const Outline: Story = {
  args: { children: "Outline", variant: "outline" },
};

export const WarningBadge: Story = {
  name: "Warning (custom)",
  render: () => (
    <Badge className="h-6 gap-1 rounded-md border border-warning-border bg-warning px-2.5 py-1 text-xs font-medium text-warning-foreground">
      <AlertTriangle className="h-3 w-3 text-warning-foreground" />3 sin nombre
    </Badge>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

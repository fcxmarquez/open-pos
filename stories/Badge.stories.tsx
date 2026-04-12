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
      options: [
        "default",
        "muted",
        "success",
        "info",
        "warning",
        "inverted",
        "outline-solid",
      ],
    },
    size: {
      control: "select",
      options: ["compact", "chip", "pill"],
    },
  },
} satisfies Meta<typeof Badge>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Badge" },
};

export const Outline: Story = {
  args: { children: "Outline", variant: "outline" },
};

export const Muted: Story = {
  args: { children: "Muted", variant: "muted" },
};

export const Info: Story = {
  args: { children: "Info", variant: "info" },
};

export const Success: Story = {
  args: { children: "Success", variant: "success" },
};

export const WarningBadge: Story = {
  name: "Warning",
  render: () => (
    <Badge variant="warning" size="compact">
      <AlertTriangle className="h-3 w-3" />3 sin nombre
    </Badge>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge>Default</Badge>
      <Badge variant="muted">Muted</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="outline">Outline</Badge>
      <div className="rounded-xl bg-foreground p-2">
        <Badge variant="inverted">Inverted</Badge>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="muted" size="compact">
        Compact
      </Badge>
      <Badge variant="muted" size="chip">
        Chip
      </Badge>
      <Badge variant="muted" size="pill">
        Pill
      </Badge>
    </div>
  ),
};

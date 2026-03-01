import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "Design Tokens/Shadows",
  tags: ["autodocs"],
} satisfies Meta;
export default meta;

type Story = StoryObj;

export const ElevationPolicy: Story = {
  name: "Elevation Policy",
  render: () => (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-muted-foreground">
        The app uses a <strong className="text-foreground">flat design</strong>. Surfaces
        have no shadow by default. Shadows are reserved for overlays and hover feedback
        only.
      </p>

      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-24 w-36 items-center justify-center rounded-2xl border border-border bg-card text-xs text-foreground">
            shadow-none
          </div>
          <span className="text-xs font-medium text-foreground">Default</span>
          <span className="text-xs text-muted-foreground">
            All surfaces, cards, panels
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-24 w-36 items-center justify-center rounded-2xl border border-border bg-card text-xs text-foreground shadow-sm">
            shadow-sm
          </div>
          <span className="text-xs font-medium text-foreground">Hover</span>
          <span className="text-xs text-muted-foreground">
            Cards on hover, active tabs
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-24 w-36 items-center justify-center rounded-2xl border border-border bg-card text-xs text-foreground shadow-md">
            shadow-md
          </div>
          <span className="text-xs font-medium text-foreground">Overlay</span>
          <span className="text-xs text-muted-foreground">
            Dropdowns, popovers, tooltips
          </span>
        </div>
      </div>

      <div className="max-w-lg space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Rules</h3>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li>
            Cards, panels, and tables are flat — use{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
              border border-border
            </code>{" "}
            for definition, not shadow.
          </li>
          <li>
            Use{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
              hover:shadow-sm
            </code>{" "}
            only on interactive cards (e.g. product cards with click handlers).
          </li>
          <li>
            Use{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
              shadow-md
            </code>{" "}
            only for floating overlays (selects, popovers, search suggestions).
          </li>
          <li>
            Never use{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
              shadow-lg
            </code>{" "}
            or{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
              shadow-xl
            </code>{" "}
            on new components.
          </li>
        </ul>
      </div>
    </div>
  ),
};

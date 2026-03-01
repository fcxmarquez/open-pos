import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "Introduction",
} satisfies Meta;
export default meta;

type Story = StoryObj;

export const DesignSystem: Story = {
  name: "Design System Overview",
  render: () => (
    <div className="max-w-2xl space-y-8 p-4 text-foreground">
      <div>
        <h1 className="font-heading text-3xl font-extrabold">
          Papeleria Luna - Design System
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Design tokens and component documentation for the POS application.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-extrabold">Semantic Status Colors</h2>
        <p className="text-sm text-muted-foreground">
          Three semantic status token groups defined in globals.css and registered in
          tailwind.config.ts. Each has DEFAULT, foreground, and border variants with
          light/dark mode support.
        </p>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-success-border bg-success px-3 py-2">
            <span className="text-sm font-medium text-success-foreground">Success</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-warning-border bg-warning px-3 py-2">
            <span className="text-sm font-medium text-warning-foreground">Warning</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-info-border bg-info px-3 py-2">
            <span className="text-sm font-medium text-info-foreground">Info</span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-extrabold">Typography Scale</h2>
        <p className="text-sm text-muted-foreground">
          Standardized to Tailwind's built-in scale: text-xs (12px) through text-4xl
          (36px). No arbitrary text-[Xpx] values.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-extrabold">Height Tiers</h2>
        <p className="text-sm text-muted-foreground">
          Three-tier system for interactive elements: h-8 (32px small), h-10 (40px
          medium), h-12 (48px large).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-extrabold">Border Radius</h2>
        <p className="text-sm text-muted-foreground">
          Standardized to Tailwind tokens: rounded-md, rounded-xl, rounded-2xl,
          rounded-3xl, rounded-full.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-extrabold">Responsive Breakpoint</h2>
        <p className="text-sm text-muted-foreground">
          Single canonical breakpoint: md: (768px). Matches the useIsMobile() hook. All
          layout switches use md: exclusively.
        </p>
      </section>
    </div>
  ),
};

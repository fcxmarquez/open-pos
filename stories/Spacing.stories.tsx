import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "Design Tokens/Spacing",
  tags: ["autodocs"],
} satisfies Meta;
export default meta;

type Story = StoryObj;

export const HeightTiers: Story = {
  name: "Height Tiers",
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-end gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-8 w-32 items-center justify-center rounded-xl border border-border bg-muted text-xs text-foreground">
            h-8 (32px)
          </div>
          <span className="text-xs text-muted-foreground">
            Small - chips, compact badges
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-32 items-center justify-center rounded-xl border border-border bg-muted text-xs text-foreground">
            h-10 (40px)
          </div>
          <span className="text-xs text-muted-foreground">Medium - buttons, inputs</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-32 items-center justify-center rounded-xl border border-border bg-muted text-xs text-foreground">
            h-12 (48px)
          </div>
          <span className="text-xs text-muted-foreground">Large - CTAs, search bars</span>
        </div>
      </div>
    </div>
  ),
};

export const HeightInContext: Story = {
  name: "Heights in Context",
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="w-20 text-xs text-muted-foreground">h-8</span>
        <button
          type="button"
          className="inline-flex h-8 items-center justify-center rounded-2xl bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          Small button
        </button>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-20 text-xs text-muted-foreground">h-10</span>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Default button
        </button>
        <input
          placeholder="Default input"
          className="flex h-10 w-48 rounded-2xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
        />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-20 text-xs text-muted-foreground">h-12</span>
        <input
          placeholder="Search bar"
          className="flex h-12 w-48 rounded-2xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
        />
      </div>
    </div>
  ),
};

export const BorderRadius: Story = {
  name: "Border Radius Policy",
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-4">
        {[
          { cls: "rounded-md", label: "rounded-md (6px)" },
          { cls: "rounded-xl", label: "rounded-xl (12px)" },
          { cls: "rounded-2xl", label: "rounded-2xl (16px)" },
          { cls: "rounded-3xl", label: "rounded-3xl (24px)" },
          { cls: "rounded-full", label: "rounded-full" },
        ].map(({ cls, label }) => (
          <div key={cls} className="flex flex-col items-center gap-2">
            <div
              className={`flex h-20 w-20 items-center justify-center border border-border bg-muted ${cls}`}
            />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <div className="max-w-lg space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Usage by component</h3>
        <p className="text-sm text-muted-foreground">
          Default radius is{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
            rounded-2xl
          </code>{" "}
          (16px). Use a different token only when the table below specifies it.
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-2 pr-4 font-medium text-foreground">Token</th>
              <th className="pb-2 font-medium text-foreground">Use for</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-mono text-xs text-foreground">rounded-2xl</td>
              <td className="py-2">Buttons, inputs, selects, search bars (default)</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-mono text-xs text-foreground">rounded-xl</td>
              <td className="py-2">Cards, panels, nav items, badges (category tags)</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-mono text-xs text-foreground">rounded-md</td>
              <td className="py-2">
                Small inline elements (warning badges, status indicators)
              </td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-mono text-xs text-foreground">rounded-3xl</td>
              <td className="py-2">Large containers (cart panel)</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-foreground">
                rounded-full
              </td>
              <td className="py-2">Pagination dots, avatar-style elements</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  ),
};

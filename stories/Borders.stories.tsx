import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "Design Tokens/Borders",
  tags: ["autodocs"],
} satisfies Meta;
export default meta;

type Story = StoryObj;

export const BorderWidths: Story = {
  name: "Border Widths",
  render: () => (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-muted-foreground">
        Default width is{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
          border
        </code>{" "}
        (1px). Use{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
          border-[1.5px]
        </code>{" "}
        only for emphasized interactive inputs (select triggers, focused search fields).
      </p>

      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-44 items-center justify-center rounded-2xl border border-border bg-card text-xs text-foreground">
            border (1px)
          </div>
          <span className="text-xs text-muted-foreground">
            Default — cards, tables, buttons
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-44 items-center justify-center rounded-2xl border-[1.5px] border-foreground bg-card text-xs text-foreground">
            border-[1.5px]
          </div>
          <span className="text-xs text-muted-foreground">
            Emphasized — select triggers, key inputs
          </span>
        </div>
      </div>
    </div>
  ),
};

export const BorderColors: Story = {
  name: "Border Colors",
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-4">
        {[
          {
            cls: "border-border",
            label: "border-border",
            desc: "Default — cards, tables, dividers",
          },
          {
            cls: "border-border/60",
            label: "border-border/60",
            desc: "Subtle — table row dividers",
          },
          {
            cls: "border-foreground",
            label: "border-foreground",
            desc: "Emphasis — select triggers, key inputs",
          },
          {
            cls: "border-foreground/15",
            label: "border-foreground/15",
            desc: "Ghost — secondary buttons rest state",
          },
          {
            cls: "border-primary/20",
            label: "border-primary/20",
            desc: "Selection — selected items, active filters",
          },
        ].map(({ cls, label, desc }) => (
          <div key={cls} className="flex flex-col gap-2">
            <div
              className={`flex h-16 w-44 items-center justify-center rounded-2xl border bg-card text-xs text-foreground ${cls}`}
            />
            <span className="font-mono text-xs text-foreground">{label}</span>
            <span className="max-w-[11rem] text-xs text-muted-foreground">{desc}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex h-16 w-44 items-center justify-center rounded-2xl border border-success-border bg-success text-xs text-success-foreground">
            success-border
          </div>
          <span className="text-xs text-muted-foreground">
            Status — reconciled, confirmed
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex h-16 w-44 items-center justify-center rounded-2xl border border-warning-border bg-warning text-xs text-warning-foreground">
            warning-border
          </div>
          <span className="text-xs text-muted-foreground">
            Status — alerts, pending items
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex h-16 w-44 items-center justify-center rounded-2xl border border-info-border bg-info text-xs text-info-foreground">
            info-border
          </div>
          <span className="text-xs text-muted-foreground">
            Status — informational highlights
          </span>
        </div>
      </div>

      <div className="max-w-lg space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Rules</h3>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li>
            Default is always{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
              border border-border
            </code>
            . Use this for cards, tables, nav, separators.
          </li>
          <li>
            Use{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
              border-foreground
            </code>{" "}
            sparingly — only for inputs/selects that need visual weight.
          </li>
          <li>
            Ghost-style buttons use opacity steps:{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
              border-foreground/15
            </code>{" "}
            rest →{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
              /20
            </code>{" "}
            hover →{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
              /25
            </code>{" "}
            active.
          </li>
          <li>
            Selection highlight uses{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
              border-primary/20
            </code>{" "}
            paired with{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
              bg-primary/[0.06]
            </code>
            .
          </li>
          <li>
            Status borders always pair with their matching background:{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
              border-success-border bg-success
            </code>
            .
          </li>
        </ul>
      </div>
    </div>
  ),
};

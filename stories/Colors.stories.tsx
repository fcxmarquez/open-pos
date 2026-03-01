import type { Meta, StoryObj } from "@storybook/nextjs-vite";

function ColorSwatch({
  name,
  bg,
  text,
  border,
}: {
  name: string;
  bg: string;
  text: string;
  border?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`flex h-20 w-40 items-center justify-center rounded-xl ${border ? `border ${border}` : ""} ${bg}`}
      >
        <span className={`text-sm font-semibold ${text}`}>{name}</span>
      </div>
      <span className="text-xs text-muted-foreground">{bg}</span>
    </div>
  );
}

function ColorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="flex flex-wrap gap-4">{children}</div>
    </div>
  );
}

const meta = {
  title: "Design Tokens/Colors",
  tags: ["autodocs"],
} satisfies Meta;
export default meta;

type Story = StoryObj;

export const CoreColors: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <ColorSection title="Primary">
        <ColorSwatch name="Primary" bg="bg-primary" text="text-primary-foreground" />
        <ColorSwatch name="Foreground" bg="bg-foreground" text="text-background" />
        <ColorSwatch
          name="Background"
          bg="bg-background"
          text="text-foreground"
          border="border-border"
        />
      </ColorSection>

      <ColorSection title="Surface">
        <ColorSwatch
          name="Card"
          bg="bg-card"
          text="text-card-foreground"
          border="border-border"
        />
        <ColorSwatch name="Muted" bg="bg-muted" text="text-muted-foreground" />
        <ColorSwatch
          name="Secondary"
          bg="bg-secondary"
          text="text-secondary-foreground"
        />
        <ColorSwatch name="Accent" bg="bg-accent" text="text-accent-foreground" />
      </ColorSection>

      <ColorSection title="Destructive">
        <ColorSwatch
          name="Destructive"
          bg="bg-destructive"
          text="text-destructive-foreground"
        />
      </ColorSection>
    </div>
  ),
};

export const StatusColors: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <ColorSection title="Success">
        <ColorSwatch
          name="Success"
          bg="bg-success"
          text="text-success-foreground"
          border="border-success-border"
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex h-20 w-40 items-center justify-center rounded-xl border border-success-border bg-success">
            <span className="text-sm font-semibold text-success-foreground">
              Foreground
            </span>
          </div>
          <span className="text-xs text-muted-foreground">text-success-foreground</span>
        </div>
      </ColorSection>

      <ColorSection title="Warning">
        <ColorSwatch
          name="Warning"
          bg="bg-warning"
          text="text-warning-foreground"
          border="border-warning-border"
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex h-20 w-40 items-center justify-center rounded-xl border border-warning-border bg-warning">
            <span className="text-sm font-semibold text-warning-foreground">
              Foreground
            </span>
          </div>
          <span className="text-xs text-muted-foreground">text-warning-foreground</span>
        </div>
      </ColorSection>

      <ColorSection title="Info">
        <ColorSwatch
          name="Info"
          bg="bg-info"
          text="text-info-foreground"
          border="border-info-border"
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex h-20 w-40 items-center justify-center rounded-xl border border-info-border bg-info">
            <span className="text-sm font-semibold text-info-foreground">Foreground</span>
          </div>
          <span className="text-xs text-muted-foreground">text-info-foreground</span>
        </div>
      </ColorSection>
    </div>
  ),
};

export const StatusUsageExamples: Story = {
  name: "Status - Usage Examples",
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 rounded-xl border border-success-border bg-success p-3">
        <span className="text-sm font-medium text-success-foreground">
          Arqueo cuadrado - diferencia: $0.00
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-warning-border bg-warning p-3">
        <span className="text-sm font-medium text-warning-foreground">
          3 productos sin nombre registrado
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-info-border bg-info p-3">
        <span className="text-sm font-medium text-info-foreground">
          Total esperado: $1,250.00
        </span>
      </div>
    </div>
  ),
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "Design Tokens/Typography",
  tags: ["autodocs"],
} satisfies Meta;
export default meta;

type Story = StoryObj;

export const FontFamilies: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-1 text-xs text-muted-foreground">
          font-heading (Plus Jakarta Sans)
        </p>
        <h2 className="font-heading text-2xl font-extrabold text-foreground">
          Corte de Caja
        </h2>
      </div>
      <div>
        <p className="mb-1 text-xs text-muted-foreground">font-body (Inter)</p>
        <p className="font-body text-base text-foreground">
          El sistema de punto de venta para Papeleria Luna.
        </p>
      </div>
    </div>
  ),
};

export const Scale: Story = {
  name: "Type Scale",
  render: () => (
    <div className="flex flex-col gap-4">
      {[
        { cls: "text-4xl", label: "text-4xl (36px)", sample: "$1,250.00" },
        { cls: "text-3xl", label: "text-3xl (30px)", sample: "$850.50" },
        {
          cls: "text-2xl",
          label: "text-2xl (24px)",
          sample: "Corte de Caja",
        },
        { cls: "text-lg", label: "text-lg (18px)", sample: "Total ventas" },
        {
          cls: "text-base",
          label: "text-base (16px)",
          sample: "Cuaderno de notas profesional",
        },
        {
          cls: "text-sm",
          label: "text-sm (14px)",
          sample: "3 ventas registradas hoy",
        },
        {
          cls: "text-xs",
          label: "text-xs (12px)",
          sample: "Sesión abierta - 14:30",
        },
      ].map(({ cls, label, sample }) => (
        <div key={cls} className="flex items-baseline gap-4">
          <span className="w-40 shrink-0 text-xs text-muted-foreground">{label}</span>
          <span className={`${cls} text-foreground`}>{sample}</span>
        </div>
      ))}
    </div>
  ),
};

export const HeadingWeights: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <h1 className="font-heading text-2xl font-extrabold text-foreground">
        Extrabold (headings default)
      </h1>
      <p className="text-base font-semibold text-foreground">Semibold (labels, badges)</p>
      <p className="text-base font-medium text-foreground">Medium (body emphasis)</p>
      <p className="text-base text-foreground">Regular (body text)</p>
      <p className="text-sm text-muted-foreground">Muted foreground (secondary text)</p>
    </div>
  ),
};

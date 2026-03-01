import type { Category } from "@/lib/store";

export const CATEGORY_COLOR_MAP: Record<Category, string> = {
  General: "#64748B", // slate — neutral default
  Papelería: "#7C3AED", // deep violet — stationery brand feel
  "Útiles escolares": "#16A34A", // green — school/learning
  Arte: "#EC4899", // pink — creative/artistic
  Oficina: "#0EA5E9", // sky blue — professional
  Escritura: "#2563EB", // blue — ink/writing
  Cuadernos: "#0D9488", // teal — notebooks
  Papel: "#06B6D4", // cyan — light/paper
  Adhesivos: "#D97706", // amber — glue/warm
  "Colores y Dibujo": "#F97316", // orange — vibrant colors
  Corrección: "#DC2626", // red — error/correction
  "Corte y Medición": "#059669", // emerald — tools
  Cintas: "#9333EA", // purple — tape/binding
  "Notas Adhesivas": "#EAB308", // yellow — post-its
  Otro: "#000000", // black — unknown/other
};

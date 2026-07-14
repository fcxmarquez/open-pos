import type { Category } from "@/lib/store";

/** Stable translation keys for category display labels. */
export const CATEGORY_MESSAGE_KEYS = {
  General: "general",
  Papelería: "papeleria",
  "Útiles escolares": "utilesEscolares",
  Arte: "arte",
  Oficina: "oficina",
  Escritura: "escritura",
  Cuadernos: "cuadernos",
  Papel: "papel",
  Adhesivos: "adhesivos",
  "Colores y Dibujo": "coloresYDibujo",
  Corrección: "correccion",
  "Corte y Medición": "corteYMedicion",
  Cintas: "cintas",
  "Notas Adhesivas": "notasAdhesivas",
  Otro: "otro",
} as const satisfies Record<Category, string>;

export type CategoryMessageKey = (typeof CATEGORY_MESSAGE_KEYS)[Category];

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && Object.hasOwn(CATEGORY_MESSAGE_KEYS, value);
}

export function getCategoryMessageKey(category: Category): CategoryMessageKey {
  return CATEGORY_MESSAGE_KEYS[category];
}

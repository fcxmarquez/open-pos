import {
  type CorteHistoryRange,
  type CorteHistoryView,
  isCorteHistoryRange,
  isCorteHistoryView,
} from "@/lib/corte-history";

export const CORTE_HISTORY_PANEL_PREFERENCES_KEY = "papeleria-admin-corte-history-panel";

export interface CorteHistoryPanelPreferences {
  range: CorteHistoryRange;
  view: CorteHistoryView;
}

function isCorteHistoryPanelPreferences(
  value: unknown
): value is CorteHistoryPanelPreferences {
  return (
    typeof value === "object" &&
    value !== null &&
    "view" in value &&
    "range" in value &&
    isCorteHistoryView(value.view) &&
    isCorteHistoryRange(value.range)
  );
}

export function readCorteHistoryPanelPreferences(): CorteHistoryPanelPreferences | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CORTE_HISTORY_PANEL_PREFERENCES_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    return isCorteHistoryPanelPreferences(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCorteHistoryPanelPreferences(
  preferences: CorteHistoryPanelPreferences
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CORTE_HISTORY_PANEL_PREFERENCES_KEY,
      JSON.stringify(preferences)
    );
  } catch {
    // Ignore quota and security errors.
  }
}

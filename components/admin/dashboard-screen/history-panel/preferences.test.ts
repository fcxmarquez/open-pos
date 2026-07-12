import { afterEach, describe, expect, test } from "bun:test";
import {
  CORTE_HISTORY_PANEL_PREFERENCES_KEY,
  readCorteHistoryPanelPreferences,
  writeCorteHistoryPanelPreferences,
} from "./preferences";

const storage = new Map<string, string>();

afterEach(() => {
  storage.clear();
});

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    },
  },
});

describe("corte history panel preferences", () => {
  test("returns null when nothing is stored", () => {
    expect(readCorteHistoryPanelPreferences()).toBeNull();
  });

  test("persists the selected graph type and range", () => {
    writeCorteHistoryPanelPreferences({ view: "line", range: "6M" });

    expect(storage.get(CORTE_HISTORY_PANEL_PREFERENCES_KEY)).toBe(
      JSON.stringify({ view: "line", range: "6M" })
    );
    expect(readCorteHistoryPanelPreferences()).toEqual({
      view: "line",
      range: "6M",
    });
  });

  test("ignores invalid stored values", () => {
    storage.set(
      CORTE_HISTORY_PANEL_PREFERENCES_KEY,
      JSON.stringify({ view: "pie", range: "30D" })
    );

    expect(readCorteHistoryPanelPreferences()).toBeNull();
  });

  test("ignores malformed stored values", () => {
    storage.set(CORTE_HISTORY_PANEL_PREFERENCES_KEY, "{not-json");

    expect(readCorteHistoryPanelPreferences()).toBeNull();
  });
});

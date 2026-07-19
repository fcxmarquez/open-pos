import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import {
  addSessionEnvironment,
  classifyPath,
  decidePreToolUse,
  evaluateGreen,
  evaluateRed,
  extractPatchPaths,
  getSessionStatePath,
  isGateCommand,
} from "./tdd-gate-lib";

describe("classifyPath", () => {
  test("recognizes colocated and directory-based tests", () => {
    expect(classifyPath("lib/cart.test.ts")).toBe("test");
    expect(classifyPath("components/cart/__tests__/checkout.tsx")).toBe("test");
    expect(classifyPath("test/fixtures/cart.json")).toBe("test");
    expect(classifyPath("lib/cart.ts")).toBe("production");
  });
});

describe("extractPatchPaths", () => {
  test("extracts every file affected by a Codex apply_patch call", () => {
    const patch = `*** Begin Patch
*** Add File: lib/cart.test.ts
+test("adds an item", () => {});
*** Update File: lib/cart.ts
@@
-return [];
+return items;
*** Delete File: lib/legacy-cart.ts
*** End Patch`;

    expect(extractPatchPaths(patch)).toEqual([
      "lib/cart.test.ts",
      "lib/cart.ts",
      "lib/legacy-cart.ts",
    ]);
  });
});

describe("session scoping", () => {
  test("derives a distinct opaque state path for each Codex session", () => {
    const first = getSessionStatePath("/repo", "session-a");
    const second = getSessionStatePath("/repo", "session-b");

    expect(first).not.toBe(second);
    expect(first).toStartWith("/repo/.tdd/codex/");
    expect(first).not.toContain("session-a");
    expect(first).toEndWith(".json");
  });

  test("recognizes gate commands and injects the parent session ID", () => {
    const command = "bun .agents/skills/tdd-feature-workflow/scripts/tdd-gate.ts status";

    expect(isGateCommand(command)).toBe(true);
    expect(addSessionEnvironment(command, "session-a")).toBe(
      `TDD_CODEX_SESSION_ID='session-a' ${command}`
    );
    expect(isGateCommand("bun test lib/cart.test.ts")).toBe(false);
  });

  test("keeps active workflows isolated between concurrent parent sessions", () => {
    const firstSession = `test-first-${randomUUID()}`;
    const secondSession = `test-second-${randomUUID()}`;

    try {
      expect(runGate(firstSession, ["start", "--task", "first workflow"]).status).toBe(0);
      expect(runGate(secondSession, ["status"]).stdout).toContain(
        "No active TDD workflow."
      );
      expect(runGate(secondSession, ["start", "--task", "second workflow"]).status).toBe(
        0
      );
      expect(runGate(firstSession, ["status"]).stdout).toContain("first workflow");
      expect(runGate(secondSession, ["status"]).stdout).toContain("second workflow");
    } finally {
      runGate(firstSession, ["abort", "--reason", "test cleanup"]);
      runGate(secondSession, ["abort", "--reason", "test cleanup"]);
    }
  });
});

function runGate(sessionId: string, args: string[]) {
  return spawnSync("bun", [join(import.meta.dir, "tdd-gate.ts"), ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, TDD_CODEX_SESSION_ID: sessionId },
  });
}

describe("evaluateRed", () => {
  test("accepts only an expected behavioral failure with new tests and no production edits", () => {
    expect(
      evaluateRed({
        exitCode: 1,
        output: "(fail) cart rejects an expired coupon",
        expectedPattern: "cart rejects an expired coupon",
        changedTests: ["lib/cart.test.ts"],
        productionChanges: [],
      })
    ).toEqual({ allowed: true });
  });

  test("rejects a red run after production code changed", () => {
    const result = evaluateRed({
      exitCode: 1,
      output: "(fail) cart rejects an expired coupon",
      expectedPattern: "cart rejects an expired coupon",
      changedTests: ["lib/cart.test.ts"],
      productionChanges: ["lib/cart.ts"],
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("production");
  });

  test("rejects infrastructure failures masquerading as red", () => {
    const result = evaluateRed({
      exitCode: 1,
      output: "Cannot find module './missing-fixture'",
      expectedPattern: "missing-fixture",
      changedTests: ["lib/cart.test.ts"],
      productionChanges: [],
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("infrastructure");
  });
});

describe("evaluateGreen", () => {
  test("requires the unchanged red tests to pass", () => {
    expect(evaluateGreen({ exitCode: 0, testsUnchanged: true })).toEqual({
      allowed: true,
    });
    expect(evaluateGreen({ exitCode: 0, testsUnchanged: false }).allowed).toBe(false);
    expect(evaluateGreen({ exitCode: 1, testsUnchanged: true }).allowed).toBe(false);
  });
});

describe("decidePreToolUse", () => {
  test("blocks production writes until red is verified", () => {
    expect(
      decidePreToolUse({
        phase: "awaiting_red",
        role: "main",
        toolName: "apply_patch",
        filePath: "lib/cart.ts",
      }).allowed
    ).toBe(false);

    expect(
      decidePreToolUse({
        phase: "awaiting_red",
        role: "test-engineer",
        toolName: "apply_patch",
        filePath: "lib/cart.test.ts",
      })
    ).toEqual({ allowed: true });
  });

  test("keeps worker ownership separated after red", () => {
    expect(
      decidePreToolUse({
        phase: "red_verified",
        role: "test-engineer",
        toolName: "apply_patch",
        filePath: "lib/cart.ts",
      }).allowed
    ).toBe(false);

    expect(
      decidePreToolUse({
        phase: "red_verified",
        role: "feature-engineer",
        toolName: "apply_patch",
        filePath: "lib/cart.test.ts",
      }).allowed
    ).toBe(false);
  });

  test("permits test commands but blocks arbitrary shell mutation before red", () => {
    expect(
      decidePreToolUse({
        phase: "awaiting_red",
        role: "test-engineer",
        toolName: "Bash",
        command: "bun test lib/cart.test.ts",
      })
    ).toEqual({ allowed: true });

    expect(
      decidePreToolUse({
        phase: "awaiting_red",
        role: "test-engineer",
        toolName: "Bash",
        command: "cp implementation.ts lib/cart.ts",
      }).allowed
    ).toBe(false);
  });

  test("rejects compound commands and mutating find operations", () => {
    expect(
      decidePreToolUse({
        phase: "awaiting_red",
        role: "test-engineer",
        toolName: "Bash",
        command: "bun test cart; pwd",
      }).allowed
    ).toBe(false);

    expect(
      decidePreToolUse({
        phase: "awaiting_red",
        role: "test-engineer",
        toolName: "Bash",
        command: "find lib -name '*.ts' -delete",
      }).allowed
    ).toBe(false);
  });
});

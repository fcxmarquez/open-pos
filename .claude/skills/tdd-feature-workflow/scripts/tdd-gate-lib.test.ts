import { describe, expect, test } from "bun:test";
import {
  classifyPath,
  decidePreToolUse,
  evaluateGreen,
  evaluateRed,
} from "./tdd-gate-lib";

describe("classifyPath", () => {
  test("recognizes colocated and directory-based tests", () => {
    expect(classifyPath("lib/cart.test.ts")).toBe("test");
    expect(classifyPath("components/cart/__tests__/checkout.tsx")).toBe("test");
    expect(classifyPath("test/fixtures/cart.json")).toBe("test");
    expect(classifyPath("lib/cart.ts")).toBe("production");
  });
});

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
        toolName: "Write",
        filePath: "lib/cart.ts",
      }).allowed
    ).toBe(false);

    expect(
      decidePreToolUse({
        phase: "awaiting_red",
        role: "test-engineer",
        toolName: "Edit",
        filePath: "lib/cart.test.ts",
      })
    ).toEqual({ allowed: true });
  });

  test("keeps worker ownership separated after red", () => {
    expect(
      decidePreToolUse({
        phase: "red_verified",
        role: "test-engineer",
        toolName: "Edit",
        filePath: "lib/cart.ts",
      }).allowed
    ).toBe(false);

    expect(
      decidePreToolUse({
        phase: "red_verified",
        role: "feature-engineer",
        toolName: "Edit",
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
});

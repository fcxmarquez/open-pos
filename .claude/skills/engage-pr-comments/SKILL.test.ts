import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("engage-pr-comments GraphQL pagination contract", () => {
  test("exposes reply pageInfo and instructs pagination with the reply cursor", () => {
    const skill = readFileSync(join(import.meta.dir, "SKILL.md"), "utf8");
    const commentsSelection = skill.match(
      /comments\(first:\s*100[^)]*\)\s*\{([\s\S]*?)\n\s{10}\}/
    )?.[1];

    expect(commentsSelection).toBeDefined();
    expect(commentsSelection).toContain("pageInfo");
    expect(commentsSelection).toContain("hasNextPage");
    expect(commentsSelection).toContain("endCursor");
    expect(skill).toMatch(/reply cursor/i);
  });
});

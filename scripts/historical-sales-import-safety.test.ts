import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import packageJson from "../package.json";
import vercelConfig from "../vercel.json";

async function readDrizzleConfigInFreshProcess(databaseUrlUnpooled: string) {
  const child = Bun.spawn({
    cmd: [
      process.execPath,
      "-e",
      'import config from "./drizzle.config.ts"; console.log(JSON.stringify(config.dbCredentials));',
    ],
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL:
        "postgresql://redacted@ep-example-pooler.us-east-1.aws.neon.tech/neondb",
      DATABASE_URL_UNPOOLED: databaseUrlUnpooled,
      NODE_ENV: "test",
      VERCEL_ENV: "development",
    },
    stderr: "pipe",
    stdout: "pipe",
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);

  return { exitCode, stderr, stdout };
}

describe("historical import deployment safety", () => {
  test("keeps deployment builds free of migrations and historical imports", async () => {
    const scripts: Record<string, string | undefined> = packageJson.scripts;
    const automaticCommands = [
      scripts.build,
      scripts.prebuild,
      scripts.postbuild,
      scripts.prepare,
      scripts.postinstall,
      scripts["vercel-build"],
      vercelConfig.buildCommand,
      await readFile(`${process.cwd()}/.github/workflows/ci.yml`, "utf8"),
    ]
      .filter((command): command is string => typeof command === "string")
      .join("\n");

    expect(automaticCommands).not.toContain("db:import:historical-sales");
    expect(automaticCommands).not.toContain("scripts/import-historical-sales.ts");
    expect(vercelConfig.buildCommand).not.toContain("db:migrate");
    expect(vercelConfig.buildCommand).not.toContain("drizzle-kit migrate");
    expect(scripts["db:import:historical-sales"]).not.toContain(
      "--execute-development-import"
    );
    expect(scripts["db:import:historical-sales"]).not.toContain(
      "--execute-production-import"
    );
  });

  test("prefers the unpooled connection for schema migrations", async () => {
    const unpooledUrl = "postgresql://redacted@ep-example.us-east-1.aws.neon.tech/neondb";
    const result = await readDrizzleConfigInFreshProcess(unpooledUrl);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ url: unpooledUrl });
  });

  test("requires an unpooled URL for every schema migration", async () => {
    const result = await readDrizzleConfigInFreshProcess("");

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("DATABASE_URL_UNPOOLED");
  });

  test("blocks import execution in Vercel and CI runtimes", async () => {
    const automaticRuntimeSignals = [
      { expectedSignal: /Vercel/i, env: { VERCEL: "1" } },
      { expectedSignal: /CI/i, env: { CI: "1" } },
    ];

    for (const { env, expectedSignal } of automaticRuntimeSignals) {
      const child = Bun.spawn({
        cmd: [
          process.execPath,
          "scripts/import-historical-sales.ts",
          "--target=production",
          "--execute-production-import",
          "--confirm=production-fixture-confirmation",
        ],
        cwd: process.cwd(),
        env: {
          ...process.env,
          ...env,
          NODE_ENV: "production",
        },
        stderr: "pipe",
        stdout: "pipe",
      });
      const [exitCode, stdout, stderr] = await Promise.all([
        child.exited,
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
      ]);
      const output = `${stdout}\n${stderr}`;

      expect(exitCode).toBe(1);
      expect(output).toMatch(expectedSignal);
      expect(output).not.toContain("starting one atomic");
    }
  });
});

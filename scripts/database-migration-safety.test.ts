import { describe, expect, test } from "bun:test";
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

describe("database migration deployment safety", () => {
  test("runs migrations before the deployment build without data-import commands", () => {
    const scripts: Record<string, string | undefined> = packageJson.scripts;
    const automaticCommands = [
      scripts.build,
      scripts.prebuild,
      scripts.postbuild,
      scripts.prepare,
      scripts.postinstall,
      scripts["vercel-build"],
      vercelConfig.buildCommand,
    ]
      .filter((command): command is string => typeof command === "string")
      .join("\n");

    expect(vercelConfig.buildCommand).toBe("bun run db:migrate:deploy && bun run build");
    expect(automaticCommands).not.toContain("import-historical-sales");
    expect(automaticCommands).not.toContain("historical-sales-import");
  });

  test("uses the direct connection for schema migrations", async () => {
    const unpooledUrl = "postgresql://redacted@ep-example.us-east-1.aws.neon.tech/neondb";
    const result = await readDrizzleConfigInFreshProcess(unpooledUrl);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ url: unpooledUrl });
  });

  test("fails closed when the direct migration URL is absent", async () => {
    const result = await readDrizzleConfigInFreshProcess("");

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("DATABASE_URL_UNPOOLED");
  });
});

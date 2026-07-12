import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("PWA assets and configuration", () => {
  it("declares a standalone app icon and caches the application shell assets", async () => {
    const [config, icon] = await Promise.all([
      readFile(resolve(process.cwd(), "vite.config.ts"), "utf8"),
      readFile(resolve(process.cwd(), "public/icons/snarelab-icon.svg"), "utf8"),
    ]);

    expect(config).toContain('const base = process.env.VITE_BASE_PATH ?? "/";');
    expect(config).toContain('src: `${base}icons/snarelab-icon.svg`');
    expect(config).toContain("start_url: base");
    expect(config).toContain("globPatterns");
    expect(config).toContain("**/*.{js,css,html,png,woff2}");
    expect(icon).toContain("SnareLab");
  });
});

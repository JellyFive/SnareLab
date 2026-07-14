import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("PWA assets and configuration", () => {
  it("declares a standalone app icon and precaches local drum samples", async () => {
    const sampleFiles = [
      "hi-hat.wav",
      "snare.wav",
      "kick.wav",
      "tom-1.wav",
      "tom-2.wav",
      "tom-3.wav",
      "ride.wav",
      "crash.wav",
    ];
    const [config, appMark, icon, icon192, icon512, ...samples] = await Promise.all([
      readFile(resolve(process.cwd(), "vite.config.ts"), "utf8"),
      readFile(resolve(process.cwd(), "src/assets/snarelab-mark.svg"), "utf8"),
      readFile(resolve(process.cwd(), "public/icons/snarelab-icon.svg"), "utf8"),
      readFile(resolve(process.cwd(), "public/icons/snarelab-icon-192.png")),
      readFile(resolve(process.cwd(), "public/icons/snarelab-icon-512.png")),
      ...sampleFiles.map((fileName) =>
        readFile(resolve(process.cwd(), "public/audio/drum-kit", fileName)),
      ),
    ]);

    expect(config).toContain('const base = process.env.VITE_BASE_PATH ?? "/";');
    expect(config).toContain('src: `${base}icons/snarelab-icon.svg`');
    expect(config).toContain('src: `${base}icons/snarelab-icon-192.png`');
    expect(config).toContain('src: `${base}icons/snarelab-icon-512.png`');
    expect(config).toContain("start_url: base");
    expect(config).toContain("globPatterns");
    expect(config).toContain("**/*.{js,css,html,png,wav,woff2}");
    expect(icon).toBe(appMark);
    expect(icon192.byteLength).toBeGreaterThan(0);
    expect(icon512.byteLength).toBeGreaterThan(0);
    expect(samples.map((sample) => sample.byteLength)).toEqual(
      Array(sampleFiles.length).fill(expect.any(Number)),
    );
    expect(samples.every((sample) => sample.byteLength > 0)).toBe(true);
  });
});

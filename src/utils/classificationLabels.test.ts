import { describe, expect, it } from "vitest";

import type { Category, Tag } from "../types";
import { displayCategory, displayTag } from "./classificationLabels";

const category = (name: string): Category => ({
  id: "fundamentals",
  name,
  icon: "drum",
  color: "#4C7FE8",
  isSystem: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const tag = (name: string): Tag => ({
  id: "control",
  name,
  isPreset: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe("classification labels", () => {
  it("keeps Chinese defaults but shows an edited built-in classification name", () => {
    expect(displayCategory(category("Fundamentals"))).toBe("基本功");
    expect(displayCategory(category("手部热身"))).toBe("手部热身");
    expect(displayTag(tag("Control"))).toBe("控制");
    expect(displayTag(tag("稳定性"))).toBe("稳定性");
  });
});

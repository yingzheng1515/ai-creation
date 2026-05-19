import { beforeEach, describe, expect, it } from "vitest";
import { addHistoryEntry, clearHistory, getHistory } from "./history";
import type { ScriptResult } from "@/types/generation";

const result: ScriptResult = {
  type: "script",
  content: "测试脚本",
  provider: "mock",
  createdAt: "2026-05-19T00:00:00.000Z",
};

describe("local history", () => {
  beforeEach(() => {
    const store = new Map<string, string>();

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
        clear: () => store.clear(),
      },
    });
  });

  it("adds newest entries first", () => {
    addHistoryEntry({ type: "script", input: "第一个", result });
    addHistoryEntry({ type: "script", input: "第二个", result });

    expect(getHistory()).toHaveLength(2);
    expect(getHistory()[0].input).toBe("第二个");
  });

  it("clears entries", () => {
    addHistoryEntry({ type: "script", input: "测试", result });
    clearHistory();

    expect(getHistory()).toEqual([]);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { addHistoryEntry, clearHistory, getHistory } from "./history";
import type { ScriptResult } from "@/types/generation";

const result: ScriptResult = {
  type: "script",
  content: "测试脚本",
  provider: "mock",
  createdAt: "2026-05-19T00:00:00.000Z",
};

const savedEntry = {
  id: "entry-1",
  type: "script",
  input: "有效缓存",
  result,
  provider: "mock",
  createdAt: "2026-05-19T00:00:00.000Z",
};

describe("server history client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("lists server history entries and ignores malformed payloads", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        entries: [{ id: "broken-entry", type: "image", input: "旧缓存" }, savedEntry],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getHistory()).resolves.toEqual([savedEntry]);
    expect(fetchMock).toHaveBeenCalledWith("/api/history", { method: "GET" });
  });

  it("saves a history entry through the server API", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => savedEntry,
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(addHistoryEntry({ type: "script", input: "有效缓存", result })).resolves.toEqual(savedEntry);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/history",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ type: "script", input: "有效缓存", result }),
      }),
    );
  });

  it("clears server history entries", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ entries: [] }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await clearHistory();
    expect(fetchMock).toHaveBeenCalledWith("/api/history", { method: "DELETE" });
  });

  it("returns an unsaved entry if the server save fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("network failed");
    }));

    const saved = await addHistoryEntry({ type: "script", input: "离线保存", result });

    expect(saved.input).toBe("离线保存");
    expect(saved.result).toEqual(result);
    expect(saved.id).toContain("-");
  });
});

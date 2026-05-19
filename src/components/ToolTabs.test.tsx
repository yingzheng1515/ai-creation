import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToolTabs } from "./ToolTabs";

describe("ToolTabs", () => {
  it("switches between tools", async () => {
    render(<ToolTabs />);

    expect(screen.getByRole("heading", { name: "写脚本" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "生图" }));
    expect(screen.getByRole("heading", { name: "生图" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "生视频" }));
    expect(screen.getByRole("heading", { name: "生视频" })).toBeInTheDocument();
  });

  it("shows validation for empty script input", async () => {
    render(<ToolTabs />);

    await userEvent.click(screen.getByRole("button", { name: "生成脚本" }));
    expect(screen.getByText("请输入脚本需求。")).toBeInTheDocument();
  });

  it("notifies parent components after a generation is saved", async () => {
    const onHistoryChange = vi.fn();
    const scriptResult = {
      type: "script",
      content: "生成的脚本内容",
      provider: "mock",
      createdAt: "2026-05-19T00:00:00.000Z",
    };
    const savedEntry = {
      id: "history-1",
      type: "script",
      input: "水墨江南宣传片",
      result: scriptResult,
      createdAt: "2026-05-19T00:00:01.000Z",
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url === "/api/generate/script") {
        return {
          ok: true,
          json: async () => scriptResult,
        };
      }

      if (url === "/api/history" && init?.method === "POST") {
        return {
          ok: true,
          json: async () => savedEntry,
        };
      }

      return {
        ok: false,
        json: async () => ({ error: "Unexpected request" }),
      };
    });
    vi.stubGlobal(
      "fetch",
      fetchMock,
    );

    render(<ToolTabs onHistoryChange={onHistoryChange} />);

    await userEvent.type(screen.getByLabelText("需求"), "水墨江南宣传片");
    await userEvent.click(screen.getByRole("button", { name: "生成脚本" }));

    expect(await screen.findByText("生成的脚本内容")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/history",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          type: "script",
          input: "水墨江南宣传片",
          result: scriptResult,
        }),
      }),
    );
    expect(onHistoryChange).toHaveBeenCalledTimes(1);
  });
});

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
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          type: "script",
          content: "生成的脚本内容",
          provider: "mock",
          createdAt: "2026-05-19T00:00:00.000Z",
        }),
      })),
    );

    render(<ToolTabs onHistoryChange={onHistoryChange} />);

    await userEvent.type(screen.getByLabelText("需求"), "水墨江南宣传片");
    await userEvent.click(screen.getByRole("button", { name: "生成脚本" }));

    expect(await screen.findByText("生成的脚本内容")).toBeInTheDocument();
    expect(onHistoryChange).toHaveBeenCalledTimes(1);
  });
});

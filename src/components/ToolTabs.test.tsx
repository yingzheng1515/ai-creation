import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
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
});

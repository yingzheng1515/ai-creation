import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { HistoryEntry } from "@/types/generation";
import { WorkflowScenes } from "./WorkflowScenes";

const entries: HistoryEntry[] = [
  {
    id: "video-1",
    type: "video",
    input: "水墨宣传片视频",
    provider: "mock",
    createdAt: "2026-05-19T04:00:00.000Z",
    result: {
      type: "video",
      url: "https://example.com/video.mp4",
      prompt: "水墨宣传片视频",
      provider: "mock",
      createdAt: "2026-05-19T04:00:00.000Z",
    },
  },
  {
    id: "image-1",
    type: "image",
    input: "水墨江南主视觉",
    provider: "mock",
    createdAt: "2026-05-19T03:00:00.000Z",
    result: {
      type: "image",
      url: "https://example.com/image.jpg",
      prompt: "水墨江南主视觉",
      provider: "mock",
      createdAt: "2026-05-19T03:00:00.000Z",
    },
  },
  {
    id: "script-1",
    type: "script",
    input: "水墨江南脚本",
    provider: "mock",
    createdAt: "2026-05-19T02:00:00.000Z",
    result: {
      type: "script",
      content: "镜头从江南水面推入，白墙黛瓦映入画面。",
      provider: "mock",
      createdAt: "2026-05-19T02:00:00.000Z",
    },
  },
];

describe("WorkflowScenes", () => {
  it("renders latest generated script, image, and video into the workflow", () => {
    render(<WorkflowScenes entries={entries} />);

    expect(screen.getByText("镜头从江南水面推入，白墙黛瓦映入画面。")).toBeInTheDocument();
    expect(screen.getByAltText("水墨江南主视觉")).toHaveAttribute("src", "https://example.com/image.jpg");
    expect(screen.getByTestId("workflow-video")).toHaveAttribute("src", "https://example.com/video.mp4");
    expect(screen.getByText("视频已生成")).toBeInTheDocument();
  });

  it("shows waiting states when no generated history exists", () => {
    render(<WorkflowScenes entries={[]} />);

    expect(screen.getByText("等待脚本生成")).toBeInTheDocument();
    expect(screen.getByText("等待画面生成")).toBeInTheDocument();
    expect(screen.getByText("等待视频合成")).toBeInTheDocument();
  });
});

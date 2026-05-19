import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkflowShell } from "./WorkflowShell";

describe("WorkflowShell", () => {
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

  it("runs the full script-image-video pipeline from one prompt", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: "script",
          content: "镜头从江南水面推入。",
          scenes: [
            {
              id: "scene-1",
              title: "晨雾入画",
              shot: "镜头从江南水面推入。",
              narration: "江南醒来。",
              imagePrompt: "第一镜图片提示",
              videoPrompt: "第一镜视频提示",
              durationSeconds: 4,
            },
            {
              id: "scene-2",
              title: "乌篷船过桥",
              shot: "乌篷船穿过拱桥。",
              narration: "水路把故事带向远方。",
              imagePrompt: "第二镜图片提示",
              videoPrompt: "第二镜视频提示",
              durationSeconds: 5,
            },
          ],
          provider: "mock",
          createdAt: "2026-05-19T00:00:00.000Z",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: "image",
          url: "https://example.com/scene-1.jpg",
          prompt: "第一镜图片提示",
          provider: "mock",
          createdAt: "2026-05-19T00:00:01.000Z",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: "image",
          url: "https://example.com/scene-2.jpg",
          prompt: "第二镜图片提示",
          provider: "mock",
          createdAt: "2026-05-19T00:00:02.000Z",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: "video",
          url: "https://example.com/scene-1.mp4",
          prompt: "第一镜视频提示",
          provider: "mock",
          createdAt: "2026-05-19T00:00:03.000Z",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: "video",
          url: "https://example.com/scene-2.mp4",
          prompt: "第二镜视频提示",
          provider: "mock",
          createdAt: "2026-05-19T00:00:04.000Z",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<WorkflowShell />);

    await userEvent.type(screen.getByLabelText("核心创意"), "水墨江南宣传片");
    await userEvent.click(screen.getByRole("button", { name: "一键衍化全链路" }));

    expect(await screen.findByText("全链路完成")).toBeInTheDocument();
    expect(screen.getByText("镜头从江南水面推入。")).toBeInTheDocument();
    expect(screen.getByText("乌篷船过桥")).toBeInTheDocument();
    expect(screen.getByAltText("第一镜图片提示")).toHaveAttribute("src", "https://example.com/scene-1.jpg");
    expect(screen.getByAltText("第二镜图片提示")).toHaveAttribute("src", "https://example.com/scene-2.jpg");
    expect(screen.getAllByTestId("workflow-video")).toHaveLength(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/generate/script",
      expect.objectContaining({ body: JSON.stringify({ requirement: "水墨江南宣传片" }) }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/generate/image",
      expect.objectContaining({ body: JSON.stringify({ prompt: "第一镜图片提示" }) }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/generate/image",
      expect.objectContaining({ body: JSON.stringify({ prompt: "第二镜图片提示" }) }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "/api/generate/video",
      expect.objectContaining({ body: JSON.stringify({ prompt: "第一镜视频提示" }) }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      "/api/generate/video",
      expect.objectContaining({ body: JSON.stringify({ prompt: "第二镜视频提示" }) }),
    );
  });
});

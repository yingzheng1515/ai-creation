import { describe, expect, it } from "vitest";
import { mockImageProvider, mockScriptProvider, mockVideoProvider } from "./mock";

describe("mock providers", () => {
  it("generates a structured script response", async () => {
    const result = await mockScriptProvider.generateScript({
      requirement: "给咖啡店做一个新品短视频",
    });
    const resultWithScenes = result as typeof result & {
      scenes?: Array<{ title: string; imagePrompt: string; videoPrompt: string }>;
    };

    expect(result.type).toBe("script");
    expect(result.provider).toBe("mock");
    expect(result.content).toContain("给咖啡店做一个新品短视频");
    expect(resultWithScenes.scenes).toHaveLength(3);
    expect(resultWithScenes.scenes?.[0]).toMatchObject({
      title: "开场钩子",
      imagePrompt: expect.stringContaining("给咖啡店做一个新品短视频"),
      videoPrompt: expect.stringContaining("镜头推进"),
    });
  });

  it("generates a stable image URL", async () => {
    const result = await mockImageProvider.generateImage({ prompt: "城市夜景海报" });

    expect(result.type).toBe("image");
    expect(result.url).toMatch(/^https:\/\//);
    expect(result.prompt).toBe("城市夜景海报");
  });

  it("generates a stable video URL", async () => {
    const result = await mockVideoProvider.generateVideo({ prompt: "产品发布短片" });

    expect(result.type).toBe("video");
    expect(result.url).toMatch(/^https:\/\//);
    expect(result.prompt).toBe("产品发布短片");
  });
});

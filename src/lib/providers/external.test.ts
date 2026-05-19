import { describe, expect, it, vi } from "vitest";
import { createExternalImageProvider, createExternalScriptProvider, createExternalVideoProvider } from "./external";

describe("external providers", () => {
  it("posts script requirements to a configured HTTPS API and normalizes the response", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      content: "主题：水墨江南",
      scenes: [
        {
          id: "scene-1",
          title: "晨雾入画",
          shot: "镜头从水面推入。",
          narration: "江南醒来。",
          imagePrompt: "水墨江南图片",
          videoPrompt: "水墨江南视频",
          durationSeconds: 4,
        },
      ],
    }), { status: 200 }));
    const provider = createExternalScriptProvider({
      apiKey: "secret-token",
      fetchImpl: fetchMock,
      url: "https://api.example.com/script",
    });

    const result = await provider.generateScript({ requirement: "水墨江南宣传片" });

    expect(result).toMatchObject({
      type: "script",
      content: "主题：水墨江南",
      provider: "external",
    });
    expect(result.scenes).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/script",
      expect.objectContaining({
        body: JSON.stringify({ requirement: "水墨江南宣传片" }),
        headers: expect.objectContaining({
          authorization: "Bearer secret-token",
          "content-type": "application/json",
        }),
        method: "POST",
      }),
    );
  });

  it("normalizes image and video URLs from external APIs", async () => {
    const imageProvider = createExternalImageProvider({
      fetchImpl: vi.fn(async () => new Response(JSON.stringify({ url: "https://cdn.example.com/image.png" }))),
      url: "https://api.example.com/image",
    });
    const videoProvider = createExternalVideoProvider({
      fetchImpl: vi.fn(async () => new Response(JSON.stringify({ videoUrl: "https://cdn.example.com/video.mp4" }))),
      url: "https://api.example.com/video",
    });

    await expect(imageProvider.generateImage({ prompt: "图片提示" })).resolves.toMatchObject({
      type: "image",
      prompt: "图片提示",
      provider: "external",
      url: "https://cdn.example.com/image.png",
    });
    await expect(videoProvider.generateVideo({ prompt: "视频提示" })).resolves.toMatchObject({
      type: "video",
      prompt: "视频提示",
      provider: "external",
      url: "https://cdn.example.com/video.mp4",
    });
  });

  it("rejects unsafe endpoints and malformed third-party responses", async () => {
    const unsafeProvider = createExternalImageProvider({
      fetchImpl: vi.fn(),
      url: "http://api.example.com/image",
    });
    const malformedProvider = createExternalVideoProvider({
      fetchImpl: vi.fn(async () => new Response(JSON.stringify({ ok: true }))),
      url: "https://api.example.com/video",
    });

    await expect(unsafeProvider.generateImage({ prompt: "图片提示" })).rejects.toThrow("External image API must use HTTPS.");
    await expect(malformedProvider.generateVideo({ prompt: "视频提示" })).rejects.toThrow("External video API returned an invalid response.");
  });
});

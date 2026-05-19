import { describe, expect, it, vi } from "vitest";
import { createDeepSeekScriptProvider, createOpenAIImageProvider, createSeedanceVideoProvider } from "./vendor";

describe("vendor providers", () => {
  it("generates structured script scenes through DeepSeek chat completions", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify({
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
            }),
          },
        },
      ],
    })));
    const provider = createDeepSeekScriptProvider({
      apiKey: "deepseek-key",
      fetchImpl: fetchMock,
    });

    const result = await provider.generateScript({ requirement: "水墨江南宣传片" });

    expect(result).toMatchObject({
      type: "script",
      content: "主题：水墨江南",
      provider: "external",
    });
    expect(result.scenes).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.deepseek.com/chat/completions",
      expect.objectContaining({
        body: expect.stringContaining("\"response_format\":{\"type\":\"json_object\"}"),
        headers: expect.objectContaining({ authorization: "Bearer deepseek-key" }),
        method: "POST",
      }),
    );
  });

  it("generates an image through OpenAI image generations", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      data: [{ b64_json: "aW1hZ2UtYnl0ZXM=" }],
    })));
    const provider = createOpenAIImageProvider({
      apiKey: "openai-key",
      fetchImpl: fetchMock,
    });

    const result = await provider.generateImage({ prompt: "水墨江南图片" });

    expect(result).toMatchObject({
      type: "image",
      prompt: "水墨江南图片",
      provider: "external",
      url: "data:image/png;base64,aW1hZ2UtYnl0ZXM=",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/images/generations",
      expect.objectContaining({
        body: JSON.stringify({ model: "gpt-image-2", prompt: "水墨江南图片" }),
        headers: expect.objectContaining({ authorization: "Bearer openai-key" }),
        method: "POST",
      }),
    );
  });

  it("submits and polls a Seedance 2.0 video generation task", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "task-1" })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: "succeeded",
        content: { video_url: "https://cdn.example.com/seedance.mp4" },
      })));
    const provider = createSeedanceVideoProvider({
      apiKey: "seedance-key",
      createUrl: "https://ark.example.com/video/tasks",
      fetchImpl: fetchMock,
      pollDelayMs: 0,
      statusUrlTemplate: "https://ark.example.com/video/tasks/{taskId}",
    });

    const result = await provider.generateVideo({ prompt: "水墨江南视频" });

    expect(result).toMatchObject({
      type: "video",
      prompt: "水墨江南视频",
      provider: "external",
      url: "https://cdn.example.com/seedance.mp4",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://ark.example.com/video/tasks",
      expect.objectContaining({
        body: JSON.stringify({ model: "seedance-2.0", prompt: "水墨江南视频" }),
        headers: expect.objectContaining({ authorization: "Bearer seedance-key" }),
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://ark.example.com/video/tasks/task-1",
      expect.objectContaining({ method: "GET" }),
    );
  });
});

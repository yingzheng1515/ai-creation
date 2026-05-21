import { describe, expect, it, vi } from "vitest";
import { createDeepSeekScriptProvider, createGoogleImageProvider, createGoogleVideoProvider } from "./vendor";

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

  it("generates an image through Google Gemini image generation", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: "aW1hZ2UtYnl0ZXM=",
                },
              },
            ],
          },
        },
      ],
    })));
    const provider = createGoogleImageProvider({
      apiKey: "google-key",
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
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent",
      expect.objectContaining({
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: "水墨江南图片" }],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
        headers: expect.objectContaining({ "x-goog-api-key": "google-key" }),
        method: "POST",
      }),
    );
  });

  it("submits and polls a Google Veo video generation task", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ name: "operations/video-1" })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        done: true,
        response: {
          generateVideoResponse: {
            generatedSamples: [
              {
                video: {
                  uri: "https://cdn.example.com/google-video.mp4",
                },
              },
            ],
          },
        },
      })))
      .mockResolvedValueOnce(new Response("video-bytes", {
        headers: { "content-type": "video/mp4" },
      }));
    const provider = createGoogleVideoProvider({
      apiKey: "google-key",
      fetchImpl: fetchMock,
      pollDelayMs: 0,
    });

    const result = await provider.generateVideo({ prompt: "水墨江南视频" });

    expect(result).toMatchObject({
      type: "video",
      prompt: "水墨江南视频",
      provider: "external",
      url: "data:video/mp4;base64,dmlkZW8tYnl0ZXM=",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:predictLongRunning",
      expect.objectContaining({
        body: JSON.stringify({ instances: [{ prompt: "水墨江南视频" }] }),
        headers: expect.objectContaining({ "x-goog-api-key": "google-key" }),
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://generativelanguage.googleapis.com/v1beta/operations/video-1",
      expect.objectContaining({
        headers: expect.objectContaining({ "x-goog-api-key": "google-key" }),
        method: "GET",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://cdn.example.com/google-video.mp4",
      expect.objectContaining({
        headers: expect.objectContaining({ "x-goog-api-key": "google-key" }),
        method: "GET",
      }),
    );
  });
});

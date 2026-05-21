import { describe, expect, it, vi } from "vitest";
import { getOssConfig, uploadAssetToOss } from "./oss";

describe("OSS asset storage", () => {
  it("is disabled until all required OSS environment values are present", () => {
    expect(getOssConfig({})).toBeNull();
    expect(getOssConfig({
      ALIYUN_OSS_ACCESS_KEY_ID: "key-id",
      ALIYUN_OSS_ACCESS_KEY_SECRET: "key-secret",
      ALIYUN_OSS_BUCKET: "bucket",
    })).toBeNull();
  });

  it("uploads a data URL object to OSS and returns the public URL", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 200 }));

    const stored = await uploadAssetToOss(
      {
        kind: "image",
        prompt: "水墨江南主视觉",
        sourceUrl: "data:image/png;base64,aGVsbG8=",
      },
      {
        accessKeyId: "test-key",
        accessKeySecret: "test-secret",
        bucket: "creation-assets",
        endpoint: "oss-cn-beijing.aliyuncs.com",
        fetchImpl,
        now: () => new Date("2026-05-21T00:00:00.000Z"),
        objectAcl: "public-read",
        prefix: "ai-creation",
        publicBaseUrl: "https://cdn.example.com/assets",
        randomId: () => "fixedid",
      },
    );

    expect(stored.url).toBe("https://cdn.example.com/assets/ai-creation/images/2026/05/21/fixedid.png");
    expect(stored.objectKey).toBe("ai-creation/images/2026/05/21/fixedid.png");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://creation-assets.oss-cn-beijing.aliyuncs.com/ai-creation/images/2026/05/21/fixedid.png",
      expect.objectContaining({
        method: "PUT",
      }),
    );
    const uploadBody = fetchImpl.mock.calls[0][1]?.body as ArrayBuffer;
    expect(Object.prototype.toString.call(uploadBody)).toBe("[object ArrayBuffer]");
    expect(uploadBody.byteLength).toBe(5);
    const headers = fetchImpl.mock.calls[0][1]?.headers as Record<string, string>;

    expect(headers.authorization).toMatch(/^OSS test-key:/);
    expect(headers["content-md5"]).toBe("XUFAKrxLKna5cZ2REBfFkg==");
    expect(headers["content-type"]).toBe("image/png");
    expect(headers["x-oss-object-acl"]).toBe("public-read");
  });

  it("downloads an HTTPS source before uploading to OSS", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("movie", { headers: { "content-type": "video/mp4" }, status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    const stored = await uploadAssetToOss(
      {
        kind: "video",
        prompt: "成片",
        sourceUrl: "https://media.example.com/video.mp4",
      },
      {
        accessKeyId: "test-key",
        accessKeySecret: "test-secret",
        bucket: "creation-assets",
        endpoint: "https://oss-cn-beijing.aliyuncs.com/",
        fetchImpl,
        now: () => new Date("2026-05-21T00:00:00.000Z"),
        prefix: "ai-creation",
        randomId: () => "videoid",
      },
    );

    expect(stored.url).toBe("https://creation-assets.oss-cn-beijing.aliyuncs.com/ai-creation/videos/2026/05/21/videoid.mp4");
    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "https://media.example.com/video.mp4",
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "https://creation-assets.oss-cn-beijing.aliyuncs.com/ai-creation/videos/2026/05/21/videoid.mp4",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("rejects non-public or non-HTTPS source URLs", async () => {
    await expect(uploadAssetToOss(
      {
        kind: "image",
        prompt: "bad",
        sourceUrl: "http://127.0.0.1:3000/private.png",
      },
      {
        accessKeyId: "test-key",
        accessKeySecret: "test-secret",
        bucket: "creation-assets",
        endpoint: "oss-cn-beijing.aliyuncs.com",
      },
    )).rejects.toThrow("Only HTTPS or data URLs can be persisted to OSS.");
  });
});

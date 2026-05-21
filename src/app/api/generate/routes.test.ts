import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as postImage } from "./image/route";
import { POST as postScript } from "./script/route";
import { POST as postVideo } from "./video/route";

const request = (body: unknown) =>
  new Request("http://localhost/api/generate/test", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

describe("generation API routes", () => {
  const originalEnv = {
    ALIYUN_OSS_ACCESS_KEY_ID: process.env.ALIYUN_OSS_ACCESS_KEY_ID,
    ALIYUN_OSS_ACCESS_KEY_SECRET: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET,
    ALIYUN_OSS_BUCKET: process.env.ALIYUN_OSS_BUCKET,
    ALIYUN_OSS_ENDPOINT: process.env.ALIYUN_OSS_ENDPOINT,
    ALIYUN_OSS_PREFIX: process.env.ALIYUN_OSS_PREFIX,
    ALIYUN_OSS_PUBLIC_BASE_URL: process.env.ALIYUN_OSS_PUBLIC_BASE_URL,
  };

  beforeEach(() => {
    delete process.env.ALIYUN_OSS_ACCESS_KEY_ID;
    delete process.env.ALIYUN_OSS_ACCESS_KEY_SECRET;
    delete process.env.ALIYUN_OSS_BUCKET;
    delete process.env.ALIYUN_OSS_ENDPOINT;
    delete process.env.ALIYUN_OSS_PREFIX;
    delete process.env.ALIYUN_OSS_PUBLIC_BASE_URL;
  });

  afterEach(() => {
    vi.restoreAllMocks();

    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key as keyof typeof originalEnv];
      } else {
        process.env[key as keyof typeof originalEnv] = value;
      }
    }
  });

  it("returns script results", async () => {
    const response = await postScript(request({ requirement: "餐饮店开业宣传" }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.type).toBe("script");
    expect(json.content).toContain("餐饮店开业宣传");
    expect(json.scenes).toHaveLength(3);
    expect(json.scenes[0].imagePrompt).toContain("餐饮店开业宣传");
  });

  it("returns image results", async () => {
    const response = await postImage(request({ prompt: "科技感产品海报" }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.type).toBe("image");
    expect(json.url).toMatch(/^https:\/\//);
  });

  it("returns video results", async () => {
    const response = await postVideo(request({ prompt: "新品发布视频" }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.type).toBe("video");
    expect(json.url).toMatch(/^https:\/\//);
  });

  it("persists generated image URLs to OSS when configured", async () => {
    process.env.ALIYUN_OSS_ACCESS_KEY_ID = "test-key";
    process.env.ALIYUN_OSS_ACCESS_KEY_SECRET = "test-secret";
    process.env.ALIYUN_OSS_BUCKET = "creation-assets";
    process.env.ALIYUN_OSS_ENDPOINT = "oss-cn-beijing.aliyuncs.com";
    process.env.ALIYUN_OSS_PREFIX = "ai-creation";
    process.env.ALIYUN_OSS_PUBLIC_BASE_URL = "https://cdn.example.com/assets";

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response("image", { headers: { "content-type": "image/jpeg" }, status: 200 }))
        .mockResolvedValueOnce(new Response(null, { status: 200 })),
    );

    const response = await postImage(request({ prompt: "科技感产品海报" }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.type).toBe("image");
    expect(json.url).toMatch(/^https:\/\/cdn\.example\.com\/assets\/ai-creation\/images\/\d{4}\/\d{2}\/\d{2}\/.+\.jpg$/);
  });

  it("rejects empty input", async () => {
    const response = await postImage(request({ prompt: " " }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Prompt is required.");
  });
});

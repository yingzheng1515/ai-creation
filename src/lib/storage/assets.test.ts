import { describe, expect, it, vi } from "vitest";
import { persistGeneratedAsset } from "./assets";
import type { ImageResult } from "@/types/generation";

const image: ImageResult = {
  type: "image",
  url: "data:image/png;base64,aGVsbG8=",
  prompt: "水墨江南主视觉",
  provider: "external",
  createdAt: "2026-05-21T00:00:00.000Z",
};

describe("generated asset persistence", () => {
  it("returns the original result when OSS is not configured", async () => {
    await expect(persistGeneratedAsset(image, { env: {} })).resolves.toBe(image);
  });

  it("replaces generated asset URLs with OSS URLs when configured", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 200 }));
    const stored = await persistGeneratedAsset(image, {
      env: {
        ALIYUN_OSS_ACCESS_KEY_ID: "test-key",
        ALIYUN_OSS_ACCESS_KEY_SECRET: "test-secret",
        ALIYUN_OSS_BUCKET: "creation-assets",
        ALIYUN_OSS_ENDPOINT: "oss-cn-beijing.aliyuncs.com",
        ALIYUN_OSS_PREFIX: "ai-creation",
        ALIYUN_OSS_PUBLIC_BASE_URL: "https://cdn.example.com/assets",
      },
      fetchImpl,
      now: () => new Date("2026-05-21T00:00:00.000Z"),
      randomId: () => "assetid",
    });

    expect(stored).toEqual({
      ...image,
      url: "https://cdn.example.com/assets/ai-creation/images/2026/05/21/assetid.png",
    });
  });
});

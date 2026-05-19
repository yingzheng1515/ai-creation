import { describe, expect, it } from "vitest";
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

  it("rejects empty input", async () => {
    const response = await postImage(request({ prompt: " " }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Prompt is required.");
  });
});

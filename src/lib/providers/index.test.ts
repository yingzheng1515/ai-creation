import { describe, expect, it } from "vitest";
import { getProviders } from "./index";

describe("provider resolver", () => {
  it("uses mock providers when external endpoints are not configured", () => {
    const providers = getProviders({});

    expect(providers.script).toBeDefined();
    expect(providers.image).toBeDefined();
    expect(providers.video).toBeDefined();
    expect(providers.mode).toBe("mock");
  });

  it("uses external providers only when all three endpoints are configured", () => {
    const providers = getProviders({
      AI_IMAGE_API_URL: "https://api.example.com/image",
      AI_SCRIPT_API_URL: "https://api.example.com/script",
      AI_VIDEO_API_URL: "https://api.example.com/video",
    });

    expect(providers.mode).toBe("external");
  });

  it("rejects partial external configuration", () => {
    expect(() => getProviders({
      AI_SCRIPT_API_URL: "https://api.example.com/script",
    })).toThrow("Configure all three external AI endpoints, or leave all of them empty to use mock providers.");
  });
});

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

  it("uses vendor providers when DeepSeek and Google are configured", () => {
    const providers = getProviders({
      DEEPSEEK_API_KEY: "deepseek-key",
      GOOGLE_API_KEY: "google-key",
    });

    expect(providers.mode).toBe("external");
  });

  it("accepts GEMINI_API_KEY as the Google API key alias", () => {
    const providers = getProviders({
      DEEPSEEK_API_KEY: "deepseek-key",
      GEMINI_API_KEY: "gemini-key",
    });

    expect(providers.mode).toBe("external");
  });

  it("rejects partial external configuration", () => {
    expect(() => getProviders({
      AI_SCRIPT_API_URL: "https://api.example.com/script",
    })).toThrow("Configure all three external AI endpoints, or leave all of them empty to use mock providers.");
  });

  it("rejects partial vendor configuration", () => {
    expect(() => getProviders({
      GOOGLE_API_KEY: "google-key",
    })).toThrow("Configure DeepSeek and Google together, or leave all vendor variables empty.");
  });
});

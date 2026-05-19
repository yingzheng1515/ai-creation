import { createExternalImageProvider, createExternalScriptProvider, createExternalVideoProvider } from "./external";
import { mockImageProvider, mockScriptProvider, mockVideoProvider } from "./mock";
import type { ImageProvider, ScriptProvider, VideoProvider } from "./types";

type ProviderEnv = Record<string, string | undefined> & {
  AI_IMAGE_API_KEY?: string;
  AI_IMAGE_API_URL?: string;
  AI_SCRIPT_API_KEY?: string;
  AI_SCRIPT_API_URL?: string;
  AI_VIDEO_API_KEY?: string;
  AI_VIDEO_API_URL?: string;
};

type ProviderBundle = {
  image: ImageProvider;
  mode: "external" | "mock";
  script: ScriptProvider;
  video: VideoProvider;
};

function hasValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

export function getProviders(env: ProviderEnv = process.env): ProviderBundle {
  const configuredEndpoints = [
    env.AI_SCRIPT_API_URL,
    env.AI_IMAGE_API_URL,
    env.AI_VIDEO_API_URL,
  ].filter(hasValue).length;

  if (configuredEndpoints === 0) {
    return {
      image: mockImageProvider,
      mode: "mock",
      script: mockScriptProvider,
      video: mockVideoProvider,
    };
  }

  if (configuredEndpoints !== 3) {
    throw new Error("Configure all three external AI endpoints, or leave all of them empty to use mock providers.");
  }

  return {
    image: createExternalImageProvider({
      apiKey: env.AI_IMAGE_API_KEY,
      url: env.AI_IMAGE_API_URL,
    }),
    mode: "external",
    script: createExternalScriptProvider({
      apiKey: env.AI_SCRIPT_API_KEY,
      url: env.AI_SCRIPT_API_URL,
    }),
    video: createExternalVideoProvider({
      apiKey: env.AI_VIDEO_API_KEY,
      url: env.AI_VIDEO_API_URL,
    }),
  };
}

import { createExternalImageProvider, createExternalScriptProvider, createExternalVideoProvider } from "./external";
import { mockImageProvider, mockScriptProvider, mockVideoProvider } from "./mock";
import type { ImageProvider, ScriptProvider, VideoProvider } from "./types";
import {
  createDeepSeekScriptProvider,
  createGoogleImageProvider,
  createGoogleVideoProvider,
  createOpenAIImageProvider,
  createSeedanceVideoProvider,
} from "./vendor";

type ProviderEnv = Record<string, string | undefined> & {
  AI_IMAGE_API_KEY?: string;
  AI_IMAGE_API_URL?: string;
  AI_SCRIPT_API_KEY?: string;
  AI_SCRIPT_API_URL?: string;
  AI_VIDEO_API_KEY?: string;
  AI_VIDEO_API_URL?: string;
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_MODEL?: string;
  GEMINI_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  GOOGLE_IMAGE_MODEL?: string;
  GOOGLE_VIDEO_MODEL?: string;
  GOOGLE_VIDEO_POLL_DELAY_MS?: string;
  OPENAI_API_KEY?: string;
  OPENAI_IMAGE_MODEL?: string;
  SEEDANCE_API_KEY?: string;
  SEEDANCE_API_URL?: string;
  SEEDANCE_MODEL?: string;
  SEEDANCE_STATUS_API_URL?: string;
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

function optionalNumber(value: string | undefined): number | undefined {
  if (!hasValue(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function getProviders(env: ProviderEnv = process.env): ProviderBundle {
  const googleApiKey = hasValue(env.GOOGLE_API_KEY) ? env.GOOGLE_API_KEY : env.GEMINI_API_KEY;
  const hasGoogleVendorConfig = [
    googleApiKey,
    env.GOOGLE_IMAGE_MODEL,
    env.GOOGLE_VIDEO_MODEL,
    env.GOOGLE_VIDEO_POLL_DELAY_MS,
  ].some(hasValue);

  if (hasGoogleVendorConfig) {
    const configuredGoogleVendorValues = [
      env.DEEPSEEK_API_KEY,
      googleApiKey,
    ].filter(hasValue).length;

    if (configuredGoogleVendorValues !== 2) {
      throw new Error("Configure DeepSeek and Google together, or leave all vendor variables empty.");
    }

    return {
      image: createGoogleImageProvider({
        apiKey: googleApiKey as string,
        model: env.GOOGLE_IMAGE_MODEL,
      }),
      mode: "external",
      script: createDeepSeekScriptProvider({
        apiKey: env.DEEPSEEK_API_KEY as string,
        model: env.DEEPSEEK_MODEL,
      }),
      video: createGoogleVideoProvider({
        apiKey: googleApiKey as string,
        model: env.GOOGLE_VIDEO_MODEL,
        pollDelayMs: optionalNumber(env.GOOGLE_VIDEO_POLL_DELAY_MS),
      }),
    };
  }

  const configuredLegacyVendorValues = [
    env.DEEPSEEK_API_KEY,
    env.OPENAI_API_KEY,
    env.SEEDANCE_API_KEY,
    env.SEEDANCE_API_URL,
    env.SEEDANCE_STATUS_API_URL,
  ].filter(hasValue).length;

  if (configuredLegacyVendorValues > 0 && configuredLegacyVendorValues !== 5) {
    throw new Error("Configure DeepSeek, OpenAI, and Seedance together, or leave all vendor variables empty.");
  }

  if (configuredLegacyVendorValues === 5) {
    return {
      image: createOpenAIImageProvider({
        apiKey: env.OPENAI_API_KEY as string,
        model: env.OPENAI_IMAGE_MODEL,
      }),
      mode: "external",
      script: createDeepSeekScriptProvider({
        apiKey: env.DEEPSEEK_API_KEY as string,
        model: env.DEEPSEEK_MODEL,
      }),
      video: createSeedanceVideoProvider({
        apiKey: env.SEEDANCE_API_KEY as string,
        createUrl: env.SEEDANCE_API_URL as string,
        model: env.SEEDANCE_MODEL,
        statusUrlTemplate: env.SEEDANCE_STATUS_API_URL as string,
      }),
    };
  }

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

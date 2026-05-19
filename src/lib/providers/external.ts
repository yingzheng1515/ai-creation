import type { ImageProvider, ScriptProvider, VideoProvider } from "./types";
import type { ScriptScene } from "@/types/generation";

type FetchLike = typeof fetch;

type ExternalProviderConfig = {
  apiKey?: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  url?: string;
};

type JsonObject = Record<string, unknown>;

const DEFAULT_TIMEOUT_MS = 60_000;

const now = () => new Date().toISOString();

function asObject(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as JsonObject;
}

function requiredString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function optionalString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function optionalNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function normalizeScene(value: unknown, index: number): ScriptScene | null {
  const scene = asObject(value);
  const shot = requiredString(scene.shot);
  const imagePrompt = requiredString(scene.imagePrompt);
  const videoPrompt = requiredString(scene.videoPrompt);

  if (!shot || !imagePrompt || !videoPrompt) {
    return null;
  }

  return {
    id: requiredString(scene.id) ?? `scene-${index + 1}`,
    title: requiredString(scene.title) ?? `镜头 ${index + 1}`,
    shot,
    narration: optionalString(scene.narration),
    imagePrompt,
    videoPrompt,
    durationSeconds: optionalNumber(scene.durationSeconds, 4),
  };
}

function requireHttpsUrl(url: string | undefined, label: string): string {
  const trimmed = url?.trim();
  if (!trimmed) {
    throw new Error(`External ${label} API is not configured.`);
  }

  if (!trimmed.startsWith("https://")) {
    throw new Error(`External ${label} API must use HTTPS.`);
  }

  return trimmed;
}

async function postJson(config: ExternalProviderConfig, label: string, body: JsonObject): Promise<JsonObject> {
  const url = requireHttpsUrl(config.url, label);
  const fetchImpl = config.fetchImpl ?? fetch;
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (config.apiKey?.trim()) {
    headers.authorization = `Bearer ${config.apiKey.trim()}`;
  }

  const response = await fetchImpl(url, {
    body: JSON.stringify(body),
    headers,
    method: "POST",
    signal: AbortSignal.timeout(config.timeoutMs ?? DEFAULT_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`External ${label} API failed.`);
  }

  return asObject(await response.json());
}

export function createExternalScriptProvider(config: ExternalProviderConfig): ScriptProvider {
  return {
    async generateScript({ requirement }) {
      const payload = await postJson(config, "script", { requirement });
      const content = requiredString(payload.content) ?? requiredString(payload.script);
      const scenes = Array.isArray(payload.scenes)
        ? payload.scenes.map(normalizeScene).filter((scene): scene is ScriptScene => Boolean(scene))
        : [];

      if (!content || scenes.length === 0) {
        throw new Error("External script API returned an invalid response.");
      }

      return {
        type: "script",
        content,
        scenes,
        provider: "external",
        createdAt: now(),
      };
    },
  };
}

export function createExternalImageProvider(config: ExternalProviderConfig): ImageProvider {
  return {
    async generateImage({ prompt }) {
      const payload = await postJson(config, "image", { prompt });
      const url = requiredString(payload.url) ?? requiredString(payload.imageUrl);

      if (!url) {
        throw new Error("External image API returned an invalid response.");
      }

      return {
        type: "image",
        url,
        prompt,
        provider: "external",
        createdAt: now(),
      };
    },
  };
}

export function createExternalVideoProvider(config: ExternalProviderConfig): VideoProvider {
  return {
    async generateVideo({ prompt }) {
      const payload = await postJson(config, "video", { prompt });
      const url = requiredString(payload.url) ?? requiredString(payload.videoUrl);

      if (!url) {
        throw new Error("External video API returned an invalid response.");
      }

      return {
        type: "video",
        url,
        prompt,
        provider: "external",
        createdAt: now(),
      };
    },
  };
}

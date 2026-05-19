import type { ImageProvider, ScriptProvider, VideoProvider } from "./types";
import type { ScriptScene } from "@/types/generation";

type FetchLike = typeof fetch;
type JsonObject = Record<string, unknown>;

type DeepSeekConfig = {
  apiKey: string;
  fetchImpl?: FetchLike;
  model?: string;
};

type OpenAIImageConfig = {
  apiKey: string;
  fetchImpl?: FetchLike;
  model?: string;
};

type SeedanceVideoConfig = {
  apiKey: string;
  createUrl: string;
  fetchImpl?: FetchLike;
  model?: string;
  pollDelayMs?: number;
  statusUrlTemplate: string;
};

const DEEPSEEK_CHAT_COMPLETIONS_URL = "https://api.deepseek.com/chat/completions";
const OPENAI_IMAGE_GENERATIONS_URL = "https://api.openai.com/v1/images/generations";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";
const DEFAULT_OPENAI_IMAGE_MODEL = "gpt-image-2";
const DEFAULT_SEEDANCE_MODEL = "seedance-2.0";
const DEFAULT_POLL_DELAY_MS = 1_500;
const MAX_SEEDANCE_POLLS = 30;

const now = () => new Date().toISOString();

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
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

function requireHttpsUrl(url: string, label: string): string {
  const trimmed = url.trim();
  if (!trimmed.startsWith("https://")) {
    throw new Error(`${label} API must use HTTPS.`);
  }

  return trimmed;
}

function authHeaders(apiKey: string): Record<string, string> {
  return {
    authorization: `Bearer ${apiKey.trim()}`,
    "content-type": "application/json",
  };
}

async function readJson(response: Response, label: string): Promise<JsonObject> {
  if (!response.ok) {
    throw new Error(`${label} API failed.`);
  }

  return asObject(await response.json());
}

function parseJsonContent(content: string): JsonObject {
  try {
    return asObject(JSON.parse(content));
  } catch {
    return {};
  }
}

function imageDataUrl(base64: string): string {
  return `data:image/png;base64,${base64}`;
}

function extractTaskId(payload: JsonObject): string | null {
  const data = asObject(payload.data);
  return requiredString(payload.id)
    ?? requiredString(payload.taskId)
    ?? requiredString(payload.task_id)
    ?? requiredString(data.id)
    ?? requiredString(data.taskId)
    ?? requiredString(data.task_id);
}

function extractVideoUrl(payload: JsonObject): string | null {
  const data = asObject(payload.data);
  const content = asObject(payload.content);
  const result = asObject(payload.result);

  return requiredString(payload.url)
    ?? requiredString(payload.videoUrl)
    ?? requiredString(payload.video_url)
    ?? requiredString(data.url)
    ?? requiredString(data.videoUrl)
    ?? requiredString(data.video_url)
    ?? requiredString(content.videoUrl)
    ?? requiredString(content.video_url)
    ?? requiredString(result.videoUrl)
    ?? requiredString(result.video_url);
}

function extractStatus(payload: JsonObject): string {
  const data = asObject(payload.data);
  return (requiredString(payload.status) ?? requiredString(data.status) ?? "").toLowerCase();
}

async function delay(ms: number): Promise<void> {
  if (ms > 0) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function createDeepSeekScriptProvider(config: DeepSeekConfig): ScriptProvider {
  return {
    async generateScript({ requirement }) {
      const fetchImpl = config.fetchImpl ?? fetch;
      const response = await fetchImpl(DEEPSEEK_CHAT_COMPLETIONS_URL, {
        body: JSON.stringify({
          model: config.model ?? DEFAULT_DEEPSEEK_MODEL,
          messages: [
            {
              role: "system",
              content: [
                "你是短视频分镜编剧，只输出 JSON。",
                "JSON 格式：{ content: string, scenes: [{ id, title, shot, narration, imagePrompt, videoPrompt, durationSeconds }] }。",
                "生成 3 个镜头，每个镜头必须有适合生图和生视频的中文 prompt。",
              ].join("\n"),
            },
            { role: "user", content: requirement },
          ],
          response_format: { type: "json_object" },
        }),
        headers: authHeaders(config.apiKey),
        method: "POST",
      });
      const payload = await readJson(response, "DeepSeek");
      const choices = Array.isArray(payload.choices) ? payload.choices : [];
      const firstChoice = asObject(choices[0]);
      const message = asObject(firstChoice.message);
      const contentText = requiredString(message.content);
      const parsed = contentText ? parseJsonContent(contentText) : {};
      const content = requiredString(parsed.content);
      const scenes = Array.isArray(parsed.scenes)
        ? parsed.scenes.map(normalizeScene).filter((scene): scene is ScriptScene => Boolean(scene))
        : [];

      if (!content || scenes.length === 0) {
        throw new Error("DeepSeek script API returned an invalid response.");
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

export function createOpenAIImageProvider(config: OpenAIImageConfig): ImageProvider {
  return {
    async generateImage({ prompt }) {
      const fetchImpl = config.fetchImpl ?? fetch;
      const response = await fetchImpl(OPENAI_IMAGE_GENERATIONS_URL, {
        body: JSON.stringify({
          model: config.model ?? DEFAULT_OPENAI_IMAGE_MODEL,
          prompt,
        }),
        headers: authHeaders(config.apiKey),
        method: "POST",
      });
      const payload = await readJson(response, "OpenAI image");
      const data = Array.isArray(payload.data) ? payload.data : [];
      const firstImage = asObject(data[0]);
      const url = requiredString(firstImage.url);
      const b64Json = requiredString(firstImage.b64_json);

      if (!url && !b64Json) {
        throw new Error("OpenAI image API returned an invalid response.");
      }

      return {
        type: "image",
        url: url ?? imageDataUrl(b64Json as string),
        prompt,
        provider: "external",
        createdAt: now(),
      };
    },
  };
}

export function createSeedanceVideoProvider(config: SeedanceVideoConfig): VideoProvider {
  return {
    async generateVideo({ prompt }) {
      const createUrl = requireHttpsUrl(config.createUrl, "Seedance create");
      const fetchImpl = config.fetchImpl ?? fetch;
      const createResponse = await fetchImpl(createUrl, {
        body: JSON.stringify({
          model: config.model ?? DEFAULT_SEEDANCE_MODEL,
          prompt,
        }),
        headers: authHeaders(config.apiKey),
        method: "POST",
      });
      const createPayload = await readJson(createResponse, "Seedance create");
      const immediateUrl = extractVideoUrl(createPayload);

      if (immediateUrl) {
        return {
          type: "video",
          url: immediateUrl,
          prompt,
          provider: "external",
          createdAt: now(),
        };
      }

      const taskId = extractTaskId(createPayload);
      if (!taskId) {
        throw new Error("Seedance video API returned an invalid task response.");
      }

      const statusTemplate = requireHttpsUrl(config.statusUrlTemplate, "Seedance status");
      for (let attempt = 0; attempt < MAX_SEEDANCE_POLLS; attempt += 1) {
        await delay(config.pollDelayMs ?? DEFAULT_POLL_DELAY_MS);
        const statusUrl = statusTemplate.replace("{taskId}", encodeURIComponent(taskId));
        const statusResponse = await fetchImpl(statusUrl, {
          headers: authHeaders(config.apiKey),
          method: "GET",
        });
        const statusPayload = await readJson(statusResponse, "Seedance status");
        const videoUrl = extractVideoUrl(statusPayload);

        if (videoUrl) {
          return {
            type: "video",
            url: videoUrl,
            prompt,
            provider: "external",
            createdAt: now(),
          };
        }

        const status = extractStatus(statusPayload);
        if (["failed", "error", "canceled", "cancelled"].includes(status)) {
          throw new Error("Seedance video generation failed.");
        }
      }

      throw new Error("Seedance video generation timed out.");
    },
  };
}

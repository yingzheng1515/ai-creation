import type { GenerationResult, GenerationType, HistoryEntry } from "@/types/generation";

export type NewHistoryEntry = {
  type: GenerationType;
  input: string;
  result: GenerationResult;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isGenerationType(value: unknown): value is GenerationType {
  return value === "script" || value === "image" || value === "video";
}

export function isGenerationResult(value: unknown): value is GenerationResult {
  if (!isRecord(value) || !isGenerationType(value.type) || typeof value.provider !== "string" || typeof value.createdAt !== "string") {
    return false;
  }

  if (value.type === "script") {
    return typeof value.content === "string";
  }

  return typeof value.url === "string" && typeof value.prompt === "string";
}

export function isNewHistoryEntry(value: unknown): value is NewHistoryEntry {
  if (!isRecord(value) || !isGenerationType(value.type) || typeof value.input !== "string" || !isGenerationResult(value.result)) {
    return false;
  }

  return value.type === value.result.type;
}

export function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (
    !isRecord(value) ||
    !isGenerationType(value.type) ||
    typeof value.input !== "string" ||
    !isGenerationResult(value.result)
  ) {
    return false;
  }

  return (
    value.type === value.result.type &&
    typeof value.id === "string" &&
    typeof value.provider === "string" &&
    typeof value.createdAt === "string"
  );
}

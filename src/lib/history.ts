import type { GenerationResult, GenerationType, HistoryEntry } from "@/types/generation";

export const HISTORY_STORAGE_KEY = "ai-creation-history:v1";

type NewHistoryEntry = {
  type: GenerationType;
  input: string;
  result: GenerationResult;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGenerationType(value: unknown): value is GenerationType {
  return value === "script" || value === "image" || value === "video";
}

function isGenerationResult(value: unknown): value is GenerationResult {
  if (!isRecord(value) || !isGenerationType(value.type) || typeof value.provider !== "string" || typeof value.createdAt !== "string") {
    return false;
  }

  if (value.type === "script") {
    return typeof value.content === "string";
  }

  return typeof value.url === "string" && typeof value.prompt === "string";
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (!isRecord(value) || !isGenerationType(value.type) || !isGenerationResult(value.result)) {
    return false;
  }

  return (
    value.type === value.result.type &&
    typeof value.id === "string" &&
    typeof value.input === "string" &&
    typeof value.provider === "string" &&
    typeof value.createdAt === "string"
  );
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isHistoryEntry) : [];
  } catch {
    return [];
  }
}

export function addHistoryEntry(entry: NewHistoryEntry): HistoryEntry {
  const createdAt = new Date().toISOString();
  const saved: HistoryEntry = {
    id: `${createdAt}-${Math.random().toString(36).slice(2)}`,
    type: entry.type,
    input: entry.input,
    result: entry.result,
    provider: entry.result.provider,
    createdAt,
  };

  try {
    const next = [saved, ...getHistory()].slice(0, 50);
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
  } catch {
    return saved;
  }

  return saved;
}

export function clearHistory() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
  }
}

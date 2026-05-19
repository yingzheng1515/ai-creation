import type { GenerationResult, GenerationType, HistoryEntry } from "@/types/generation";

export const HISTORY_STORAGE_KEY = "ai-creation-history:v1";

type NewHistoryEntry = {
  type: GenerationType;
  input: string;
  result: GenerationResult;
};

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
    return Array.isArray(parsed) ? parsed : [];
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

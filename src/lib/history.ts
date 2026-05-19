import { isHistoryEntry, isRecord } from "./history-schema";
import type { NewHistoryEntry } from "./history-schema";
import type { HistoryEntry } from "@/types/generation";

function createUnsavedEntry(entry: NewHistoryEntry): HistoryEntry {
  const createdAt = new Date().toISOString();

  return {
    id: `${createdAt}-${Math.random().toString(36).slice(2)}`,
    type: entry.type,
    input: entry.input,
    result: entry.result,
    provider: entry.result.provider,
    createdAt,
  };
}

export async function getHistory(): Promise<HistoryEntry[]> {
  try {
    const response = await fetch("/api/history", { method: "GET" });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    const entries = isRecord(payload) ? payload.entries : null;

    return Array.isArray(entries) ? entries.filter(isHistoryEntry) : [];
  } catch {
    return [];
  }
}

export async function addHistoryEntry(entry: NewHistoryEntry): Promise<HistoryEntry> {
  try {
    const response = await fetch("/api/history", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(entry),
    });
    const payload = await response.json();

    if (response.ok && isHistoryEntry(payload)) {
      return payload;
    }
  } catch {
    return createUnsavedEntry(entry);
  }

  return createUnsavedEntry(entry);
}

export async function clearHistory() {
  try {
    await fetch("/api/history", { method: "DELETE" });
  } catch {
    // History is non-critical. A transient clear failure should not crash the UI.
  }
}

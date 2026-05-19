import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { isHistoryEntry } from "./history-schema";
import type { NewHistoryEntry } from "./history-schema";
import type { HistoryEntry } from "@/types/generation";

const HISTORY_LIMIT = 50;

function historyFilePath() {
  return process.env.HISTORY_FILE_PATH ?? join(process.cwd(), "data", "history.json");
}

async function readEntriesFromFile(): Promise<HistoryEntry[]> {
  try {
    const raw = await readFile(historyFilePath(), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isHistoryEntry) : [];
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }

    if (error instanceof SyntaxError) {
      return [];
    }

    throw error;
  }
}

async function writeEntriesToFile(entries: HistoryEntry[]) {
  const filePath = historyFilePath();
  const tempPath = `${filePath}.tmp`;

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(tempPath, JSON.stringify(entries, null, 2), "utf8");
  await rename(tempPath, filePath);
}

export async function listHistoryEntries(): Promise<HistoryEntry[]> {
  return readEntriesFromFile();
}

export async function addHistoryEntryToStore(entry: NewHistoryEntry): Promise<HistoryEntry> {
  const createdAt = new Date().toISOString();
  const saved: HistoryEntry = {
    id: `${createdAt}-${Math.random().toString(36).slice(2)}`,
    type: entry.type,
    input: entry.input,
    result: entry.result,
    provider: entry.result.provider,
    createdAt,
  };
  const next = [saved, ...(await readEntriesFromFile())].slice(0, HISTORY_LIMIT);

  await writeEntriesToFile(next);

  return saved;
}

export async function clearHistoryEntries() {
  await writeEntriesToFile([]);
}

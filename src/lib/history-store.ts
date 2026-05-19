import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { isHistoryEntry } from "./history-schema";
import type { NewHistoryEntry } from "./history-schema";
import type { HistoryEntry } from "@/types/generation";

const HISTORY_LIMIT = 50;
const SAFE_USER_ID_PATTERN = /[^a-zA-Z0-9_-]/g;

function historyBaseDir() {
  if (process.env.HISTORY_DATA_DIR) {
    return process.env.HISTORY_DATA_DIR;
  }

  if (process.env.HISTORY_FILE_PATH) {
    return dirname(process.env.HISTORY_FILE_PATH);
  }

  return join(process.cwd(), "data");
}

function sanitizeUserId(userId: string) {
  return userId.replace(SAFE_USER_ID_PATTERN, "_").slice(0, 96) || "anonymous";
}

function historyFilePath(userId: string) {
  return join(historyBaseDir(), "users", sanitizeUserId(userId), "history.json");
}

async function readEntriesFromFile(userId: string): Promise<HistoryEntry[]> {
  try {
    const raw = await readFile(historyFilePath(userId), "utf8");
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

async function writeEntriesToFile(userId: string, entries: HistoryEntry[]) {
  const filePath = historyFilePath(userId);
  const tempPath = `${filePath}.tmp`;

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(tempPath, JSON.stringify(entries, null, 2), "utf8");
  await rename(tempPath, filePath);
}

export async function listHistoryEntries(userId: string): Promise<HistoryEntry[]> {
  return readEntriesFromFile(userId);
}

export async function addHistoryEntryToStore(userId: string, entry: NewHistoryEntry): Promise<HistoryEntry> {
  const createdAt = new Date().toISOString();
  const saved: HistoryEntry = {
    id: `${createdAt}-${Math.random().toString(36).slice(2)}`,
    type: entry.type,
    input: entry.input,
    result: entry.result,
    provider: entry.result.provider,
    createdAt,
  };
  const next = [saved, ...(await readEntriesFromFile(userId))].slice(0, HISTORY_LIMIT);

  await writeEntriesToFile(userId, next);

  return saved;
}

export async function clearHistoryEntries(userId: string) {
  await writeEntriesToFile(userId, []);
}

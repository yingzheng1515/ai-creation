import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { isCreationProject } from "./project-schema";
import type { CreationProject, NewCreationProject } from "@/types/projects";

const PROJECT_LIMIT = 30;
const SAFE_USER_ID_PATTERN = /[^a-zA-Z0-9_-]/g;

function projectBaseDir() {
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

function projectFilePath(userId: string) {
  return join(projectBaseDir(), "users", sanitizeUserId(userId), "projects.json");
}

async function readProjectsFromFile(userId: string): Promise<CreationProject[]> {
  try {
    const raw = await readFile(projectFilePath(userId), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCreationProject) : [];
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

async function writeProjectsToFile(userId: string, projects: CreationProject[]) {
  const filePath = projectFilePath(userId);
  const tempPath = `${filePath}.tmp`;

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(tempPath, JSON.stringify(projects, null, 2), "utf8");
  await rename(tempPath, filePath);
}

export async function listProjects(userId: string): Promise<CreationProject[]> {
  return readProjectsFromFile(userId);
}

export async function addProjectToStore(userId: string, project: NewCreationProject): Promise<CreationProject> {
  const createdAt = new Date().toISOString();
  const saved: CreationProject = {
    ...project,
    id: `project_${createdAt.replace(/[^0-9]/g, "")}_${Math.random().toString(36).slice(2)}`,
    createdAt,
    updatedAt: createdAt,
  };
  const next = [saved, ...(await readProjectsFromFile(userId))].slice(0, PROJECT_LIMIT);

  await writeProjectsToFile(userId, next);

  return saved;
}

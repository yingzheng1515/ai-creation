import { isGenerationResult, isRecord } from "./history-schema";
import type { CreationProject, NewCreationProject, ProjectScene } from "@/types/projects";

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isProjectStatus(value: unknown): value is ProjectScene["status"] {
  return value === "done" || value === "partial";
}

function isProjectScene(value: unknown): value is ProjectScene {
  if (!isRecord(value) || !isString(value.id) || !isString(value.title) || !isString(value.shot)) {
    return false;
  }

  if (!isString(value.imagePrompt) || !isString(value.videoPrompt) || !isProjectStatus(value.status)) {
    return false;
  }

  if (typeof value.narration !== "string" || typeof value.durationSeconds !== "number") {
    return false;
  }

  if (value.image !== undefined && (!isGenerationResult(value.image) || value.image.type !== "image")) {
    return false;
  }

  if (value.video !== undefined && (!isGenerationResult(value.video) || value.video.type !== "video")) {
    return false;
  }

  return true;
}

export function isNewCreationProject(value: unknown): value is NewCreationProject {
  if (!isRecord(value) || !isString(value.title) || !isString(value.prompt) || !isProjectStatus(value.status)) {
    return false;
  }

  if (!isGenerationResult(value.script) || value.script.type !== "script") {
    return false;
  }

  return Array.isArray(value.scenes) && value.scenes.length > 0 && value.scenes.every(isProjectScene);
}

export function isCreationProject(value: unknown): value is CreationProject {
  if (!isRecord(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isNewCreationProject(value) &&
    isString(record.id) &&
    isString(record.createdAt) &&
    isString(record.updatedAt)
  );
}

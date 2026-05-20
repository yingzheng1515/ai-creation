import { isRecord } from "./history-schema";
import { isCreationProject } from "./project-schema";
import type { CreationProject, NewCreationProject } from "@/types/projects";

function createUnsavedProject(project: NewCreationProject): CreationProject {
  const createdAt = new Date().toISOString();

  return {
    ...project,
    id: `project_unsaved_${Math.random().toString(36).slice(2)}`,
    createdAt,
    updatedAt: createdAt,
  };
}

export async function getProjects(): Promise<CreationProject[]> {
  try {
    const response = await fetch("/api/projects", { method: "GET" });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    const projects = isRecord(payload) ? payload.projects : null;

    return Array.isArray(projects) ? projects.filter(isCreationProject) : [];
  } catch {
    return [];
  }
}

export async function addProject(project: NewCreationProject): Promise<CreationProject> {
  try {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(project),
    });
    const payload = await response.json();

    if (response.ok && isCreationProject(payload)) {
      return payload;
    }
  } catch {
    return createUnsavedProject(project);
  }

  return createUnsavedProject(project);
}

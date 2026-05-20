import type { ImageResult, ScriptResult, ScriptScene, VideoResult } from "./generation";

export type ProjectStatus = "done" | "partial";

export type ProjectScene = ScriptScene & {
  image?: ImageResult;
  status: ProjectStatus;
  video?: VideoResult;
};

export type NewCreationProject = {
  prompt: string;
  scenes: ProjectScene[];
  script: ScriptResult;
  status: ProjectStatus;
  title: string;
};

export type CreationProject = NewCreationProject & {
  createdAt: string;
  id: string;
  updatedAt: string;
};

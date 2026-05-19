import type { ImageResult, ScriptResult, VideoResult } from "@/types/generation";

export type ScriptInput = {
  requirement: string;
};

export type ImageInput = {
  prompt: string;
};

export type VideoInput = {
  prompt: string;
};

export type ScriptProvider = {
  generateScript(input: ScriptInput): Promise<ScriptResult>;
};

export type ImageProvider = {
  generateImage(input: ImageInput): Promise<ImageResult>;
};

export type VideoProvider = {
  generateVideo(input: VideoInput): Promise<VideoResult>;
};

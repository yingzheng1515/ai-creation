export type GenerationType = "script" | "image" | "video";

export type ProviderName = "mock" | "external";

export type ScriptScene = {
  id: string;
  title: string;
  shot: string;
  narration: string;
  imagePrompt: string;
  videoPrompt: string;
  durationSeconds: number;
};

export type ScriptResult = {
  type: "script";
  content: string;
  scenes?: ScriptScene[];
  provider: ProviderName;
  createdAt: string;
};

export type ImageResult = {
  type: "image";
  url: string;
  prompt: string;
  provider: ProviderName;
  createdAt: string;
};

export type VideoResult = {
  type: "video";
  url: string;
  prompt: string;
  provider: ProviderName;
  createdAt: string;
};

export type GenerationResult = ScriptResult | ImageResult | VideoResult;

export type HistoryEntry = {
  id: string;
  type: GenerationType;
  input: string;
  result: GenerationResult;
  provider: ProviderName;
  createdAt: string;
};

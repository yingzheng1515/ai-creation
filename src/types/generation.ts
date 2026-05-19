export type GenerationType = "script" | "image" | "video";

export type ProviderName = "mock";

export type ScriptResult = {
  type: "script";
  content: string;
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

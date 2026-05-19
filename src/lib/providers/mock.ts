import type { ImageProvider, ScriptProvider, VideoProvider } from "./types";

const now = () => new Date().toISOString();

export const mockScriptProvider: ScriptProvider = {
  async generateScript({ requirement }) {
    return {
      type: "script",
      content: [
        `主题：${requirement}`,
        "",
        "镜头 1：3 秒开场，用一句直接的问题抓住注意力。",
        "旁白：你有没有遇到过这样的需求，需要快速把想法变成可发布内容？",
        "",
        "镜头 2：展示核心卖点，突出脚本、图片、视频三类产出。",
        "旁白：输入目标、风格和受众，系统会生成第一版创作素材。",
        "",
        "镜头 3：结尾行动号召。",
        "旁白：保存结果，继续迭代，直到内容可以交付。",
      ].join("\n"),
      provider: "mock",
      createdAt: now(),
    };
  },
};

export const mockImageProvider: ImageProvider = {
  async generateImage({ prompt }) {
    return {
      type: "image",
      url: "https://picsum.photos/seed/ai-creation-mvp/960/540",
      prompt,
      provider: "mock",
      createdAt: now(),
    };
  },
};

export const mockVideoProvider: VideoProvider = {
  async generateVideo({ prompt }) {
    return {
      type: "video",
      url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      prompt,
      provider: "mock",
      createdAt: now(),
    };
  },
};

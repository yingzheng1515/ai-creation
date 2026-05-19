import type { ImageProvider, ScriptProvider, VideoProvider } from "./types";

const now = () => new Date().toISOString();

export const mockScriptProvider: ScriptProvider = {
  async generateScript({ requirement }) {
    const scenes = [
      {
        id: "scene-1",
        title: "开场钩子",
        shot: `用 3 秒远景建立主题：${requirement}。镜头推进到主视觉，让用户立即理解内容方向。`,
        narration: "一个想法，不必停在纸面上。",
        imagePrompt: `${requirement}，开场远景，电影感构图，主体清晰，氛围高级`,
        videoPrompt: `${requirement}，镜头推进，缓慢运动，开场建立环境，4 秒`,
        durationSeconds: 4,
      },
      {
        id: "scene-2",
        title: "核心展示",
        shot: "切到中景，展示脚本、图片、视频三类产出从同一条需求自动衍化出来。",
        narration: "输入目标、风格和受众，系统会把创意拆成可执行分镜。",
        imagePrompt: `${requirement}，中景展示创作工作流，脚本分镜、图片预览、视频时间线`,
        videoPrompt: `${requirement}，界面元素依次点亮，展示自动生成过程，5 秒`,
        durationSeconds: 5,
      },
      {
        id: "scene-3",
        title: "交付收束",
        shot: "最后用近景突出成片导出，画面收束到明确的行动按钮。",
        narration: "确认镜头，继续迭代，直到内容可以交付。",
        imagePrompt: `${requirement}，成片导出状态，近景按钮，高级产品界面质感`,
        videoPrompt: `${requirement}，镜头收束到导出按钮，轻微推近，3 秒`,
        durationSeconds: 3,
      },
    ];

    return {
      type: "script",
      content: [`主题：${requirement}`, "", ...scenes.flatMap((scene, index) => [
        `镜头 ${index + 1}：${scene.title}`,
        `画面：${scene.shot}`,
        `旁白：${scene.narration}`,
        "",
      ])].join("\n").trim(),
      scenes,
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

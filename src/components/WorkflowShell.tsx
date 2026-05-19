"use client";

import { useEffect, useState } from "react";
import { addHistoryEntry, getHistory } from "@/lib/history";
import type {
  GenerationResult,
  HistoryEntry,
  ImageResult,
  ScriptResult,
  ScriptScene,
  VideoResult,
} from "@/types/generation";
import { ToolTabs } from "./ToolTabs";
import { WorkflowScenes } from "./WorkflowScenes";

type PipelineStatus = "idle" | "script" | "image" | "video" | "done" | "error";

function scenesForPipeline(script: ScriptResult): ScriptScene[] {
  if (script.scenes && script.scenes.length > 0) {
    return script.scenes;
  }

  return [
    {
      id: "scene-1",
      title: "自动生成",
      shot: script.content,
      narration: "",
      imagePrompt: script.content,
      videoPrompt: script.content,
      durationSeconds: 4,
    },
  ];
}

async function postGeneration<T extends GenerationResult>(url: string, body: Record<string, string>): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "生成失败。");
  }

  return payload;
}

export function WorkflowShell() {
  const [historyVersion, setHistoryVersion] = useState(0);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [pipelinePrompt, setPipelinePrompt] = useState("");
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>("idle");
  const [pipelineError, setPipelineError] = useState("");

  useEffect(() => {
    setEntries(getHistory());
  }, [historyVersion]);

  const refreshWorkflow = () => setHistoryVersion((version) => version + 1);

  async function runPipeline() {
    const prompt = pipelinePrompt.trim();
    if (!prompt) {
      setPipelineStatus("error");
      setPipelineError("请输入核心创意。");
      return;
    }

    setPipelineError("");

    try {
      setPipelineStatus("script");
      const script = await postGeneration<ScriptResult>("/api/generate/script", { requirement: prompt });
      addHistoryEntry({ type: "script", input: prompt, result: script });
      refreshWorkflow();

      const scenes = scenesForPipeline(script);

      setPipelineStatus("image");
      for (const scene of scenes) {
        const image = await postGeneration<ImageResult>("/api/generate/image", { prompt: scene.imagePrompt });
        addHistoryEntry({ type: "image", input: scene.imagePrompt, result: image });
        refreshWorkflow();
      }

      setPipelineStatus("video");
      for (const scene of scenes) {
        const video = await postGeneration<VideoResult>("/api/generate/video", { prompt: scene.videoPrompt });
        addHistoryEntry({ type: "video", input: scene.videoPrompt, result: video });
        refreshWorkflow();
      }

      setPipelineStatus("done");
    } catch (caught) {
      setPipelineStatus("error");
      setPipelineError(caught instanceof Error ? caught.message : "全链路生成失败。");
    }
  }

  const isPipelineRunning = pipelineStatus === "script" || pipelineStatus === "image" || pipelineStatus === "video";

  const pipelineStatusText: Record<PipelineStatus, string> = {
    idle: "等待输入核心创意",
    script: "正在衍化剧本",
    image: "正在生成画面",
    video: "正在合成视频",
    done: "全链路完成",
    error: pipelineError || "全链路生成失败",
  };

  return (
    <div className="app-frame">
      <aside className="sidebar" aria-label="主导航">
        <div className="brand">
          <div className="brand-mark">造</div>
          <span>造物纪 AI</span>
        </div>

        <nav className="side-nav">
          <button className="side-link active" type="button">
            <span className="side-icon">层</span>
            创作台
          </button>
          <button className="side-link" type="button">
            <span className="side-icon">影</span>
            我的作品
          </button>
          <button className="side-link" type="button">
            <span className="side-icon">图</span>
            素材宝库
          </button>
          <button className="side-link" type="button">
            <span className="side-icon">卷</span>
            剧本模板
          </button>
        </nav>

        <div className="usage-card">
          <div className="usage-row">
            <span>灵力 Token</span>
            <strong>8,240</strong>
          </div>
          <div className="usage-track">
            <span />
          </div>
          <div className="user-chip">
            <span className="avatar-mark">人</span>
            <span>吾问无为</span>
          </div>
        </div>
      </aside>

      <main className="main-stage">
        <div className="ink-ring large" />
        <div className="ink-ring small" />

        <header className="topbar">
          <div className="project-title">
            <h1>《水墨江南》宣传片</h1>
            <span className="autosave">
              <span />
              自动保存中
            </span>
          </div>
          <div className="top-actions">
            <button className="ghost-button" type="button">历史版本</button>
            <button className="ink-button" type="button">一键导出全片</button>
          </div>
        </header>

        <div className="stage-scroll">
          <section className="prompt-card">
            <div className="gold-rule" />
            <div className="prompt-copy">
              <h2>初始灵感 Prompt</h2>
              <p>输入核心创意，系统会依次生成剧本、画面和视频，并同步到下方场景流。</p>
            </div>
            <div className="pipeline-panel">
              <label className="pipeline-field">
                <span>核心创意</span>
                <textarea
                  value={pipelinePrompt}
                  onChange={(event) => setPipelinePrompt(event.target.value)}
                  placeholder="例如：一段关于江南水乡的宣传片，水墨画质感，电影级景深，节奏舒缓..."
                  rows={4}
                />
              </label>
              <div className="pipeline-actions">
                <button className="gold-button" type="button" onClick={runPipeline} disabled={isPipelineRunning}>
                  {isPipelineRunning ? "衍化中..." : "一键衍化全链路"}
                </button>
                <span className={pipelineStatus === "error" ? "pipeline-status error-text" : "pipeline-status"}>
                  {pipelineStatusText[pipelineStatus]}
                </span>
              </div>
            </div>
            <ToolTabs onHistoryChange={refreshWorkflow} />
          </section>

          <WorkflowScenes entries={entries} />
        </div>

        <footer className="bottom-bar">
          <span>当前工作流节点：{entries.length > 0 ? Math.min(entries.length, 3) : 0}/3。{pipelineStatusText[pipelineStatus]}。</span>
          <div>
            <button className="ghost-button" type="button">中止衍化</button>
            <button className="gold-button" type="button" onClick={runPipeline} disabled={isPipelineRunning}>
              批量一键生成
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}

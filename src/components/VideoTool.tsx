"use client";

import { useState } from "react";
import { addHistoryEntry } from "@/lib/history";
import type { VideoResult } from "@/types/generation";
import { ResultCard } from "./ResultCard";

type VideoToolProps = {
  onSaved: () => void;
};

export function VideoTool({ onSaved }: VideoToolProps) {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<VideoResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function generate() {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("请输入视频描述。");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate/video", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "视频生成失败。");
      }

      setResult(payload);
      addHistoryEntry({ type: "video", input: trimmed, result: payload });
      onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "视频生成失败。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="tool-grid">
      <section className="tool-form" aria-labelledby="video-heading">
        <div className="section-heading">
          <p className="section-kicker">Video</p>
          <h2 id="video-heading">生视频</h2>
          <p>输入视频描述，生成一段用于验证流程的预览视频。</p>
        </div>
        <label className="field">
          <span>视频描述</span>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="例如：15 秒产品发布短片，快节奏剪辑，突出三项功能"
            rows={8}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button className="primary-button" type="button" onClick={generate} disabled={isLoading}>
            {isLoading ? "生成中..." : "生成视频"}
          </button>
        </div>
      </section>

      <section className="result-panel">
        <div className="panel-title">
          <h3>结果</h3>
        </div>
        <ResultCard result={result} />
      </section>
    </div>
  );
}

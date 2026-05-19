"use client";

import { useState } from "react";
import { addHistoryEntry } from "@/lib/history";
import type { ImageResult } from "@/types/generation";
import { ResultCard } from "./ResultCard";

type ImageToolProps = {
  onSaved: () => void;
};

export function ImageTool({ onSaved }: ImageToolProps) {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<ImageResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function generate() {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("请输入图片提示词。");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "图片生成失败。");
      }

      setResult(payload);
      addHistoryEntry({ type: "image", input: trimmed, result: payload });
      onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "图片生成失败。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="tool-grid">
      <section className="tool-form" aria-labelledby="image-heading">
        <div className="section-heading">
          <p className="section-kicker">Image</p>
          <h2 id="image-heading">生图</h2>
          <p>输入视觉提示词，生成一张可预览的图片结果。</p>
        </div>
        <label className="field">
          <span>提示词</span>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="例如：一张科技感新品发布海报，冷静专业，高级灰背景"
            rows={8}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button className="primary-button" type="button" onClick={generate} disabled={isLoading}>
            {isLoading ? "生成中..." : "生成图片"}
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

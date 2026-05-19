"use client";

import { useState } from "react";
import { addHistoryEntry } from "@/lib/history";
import type { ScriptResult } from "@/types/generation";
import { ResultCard } from "./ResultCard";

type ScriptToolProps = {
  onSaved: () => void;
};

export function ScriptTool({ onSaved }: ScriptToolProps) {
  const [requirement, setRequirement] = useState("");
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function generate() {
    const trimmed = requirement.trim();
    if (!trimmed) {
      setError("请输入脚本需求。");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate/script", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requirement: trimmed }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "脚本生成失败。");
      }

      setResult(payload);
      await addHistoryEntry({ type: "script", input: trimmed, result: payload });
      onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "脚本生成失败。");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyResult() {
    if (result) {
      await navigator.clipboard.writeText(result.content);
    }
  }

  return (
    <div className="tool-grid">
      <section className="tool-form" aria-labelledby="script-heading">
        <div className="section-heading">
          <p className="section-kicker">Script</p>
          <h2 id="script-heading">写脚本</h2>
          <p>输入主题、受众和风格，生成一版可继续修改的短视频脚本。</p>
        </div>
        <label className="field">
          <span>需求</span>
          <textarea
            value={requirement}
            onChange={(event) => setRequirement(event.target.value)}
            placeholder="例如：给咖啡店新品拿铁写一个 30 秒短视频脚本"
            rows={8}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button className="primary-button" type="button" onClick={generate} disabled={isLoading}>
            {isLoading ? "生成中..." : "生成脚本"}
          </button>
        </div>
      </section>

      <section className="result-panel">
        <div className="panel-title">
          <h3>结果</h3>
          <button className="secondary-button" type="button" onClick={copyResult} disabled={!result}>
            复制
          </button>
        </div>
        <ResultCard result={result} />
      </section>
    </div>
  );
}

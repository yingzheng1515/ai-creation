"use client";

import { useEffect, useState } from "react";
import { clearHistory, getHistory } from "@/lib/history";
import type { HistoryEntry } from "@/types/generation";

type HistoryPanelProps = {
  version: number;
  onCleared: () => void;
};

export function HistoryPanel({ version, onCleared }: HistoryPanelProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    let isCurrent = true;

    getHistory().then((historyEntries) => {
      if (isCurrent) {
        setEntries(historyEntries);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [version]);

  async function clear() {
    await clearHistory();
    setEntries([]);
    onCleared();
  }

  return (
    <section className="history-panel" aria-labelledby="history-heading">
      <div className="panel-title">
        <div>
          <h2 id="history-heading">历史</h2>
          <p className="subtitle">最近 50 条结果保存在服务器。</p>
        </div>
        <button className="secondary-button" type="button" onClick={clear} disabled={entries.length === 0}>
          清空
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="result-empty">还没有保存的生成结果。</div>
      ) : (
        <div className="history-list">
          {entries.map((entry) => (
            <article className="history-item" key={entry.id}>
              <div>
                <strong>{entry.type === "script" ? "脚本" : entry.type === "image" ? "图片" : "视频"}</strong>
                <p>{entry.input}</p>
              </div>
              <time>{new Date(entry.createdAt).toLocaleString("zh-CN")}</time>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

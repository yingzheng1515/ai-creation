"use client";

import { useEffect, useState } from "react";
import { getHistory } from "@/lib/history";
import type { HistoryEntry } from "@/types/generation";
import { ToolTabs } from "./ToolTabs";
import { WorkflowScenes } from "./WorkflowScenes";

export function WorkflowShell() {
  const [historyVersion, setHistoryVersion] = useState(0);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(getHistory());
  }, [historyVersion]);

  const refreshWorkflow = () => setHistoryVersion((version) => version + 1);

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
              <p>输入核心创意，系统先用 mock 能力跑通剧本、图片和视频三个生成入口。</p>
            </div>
            <ToolTabs onHistoryChange={refreshWorkflow} />
          </section>

          <WorkflowScenes entries={entries} />
        </div>

        <footer className="bottom-bar">
          <span>当前工作流节点：{entries.length > 0 ? Math.min(entries.length, 3) : 0}/3。生成结果会同步到场景流。</span>
          <div>
            <button className="ghost-button" type="button">中止衍化</button>
            <button className="gold-button" type="button">批量一键生成</button>
          </div>
        </footer>
      </main>
    </div>
  );
}

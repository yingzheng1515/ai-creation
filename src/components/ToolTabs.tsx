"use client";

import { useState } from "react";
import { HistoryPanel } from "./HistoryPanel";
import { ImageTool } from "./ImageTool";
import { ScriptTool } from "./ScriptTool";
import { VideoTool } from "./VideoTool";

type Tab = "script" | "image" | "video" | "history";

const tabs: { id: Tab; label: string }[] = [
  { id: "script", label: "写脚本" },
  { id: "image", label: "生图" },
  { id: "video", label: "生视频" },
  { id: "history", label: "历史" },
];

export function ToolTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("script");
  const [historyVersion, setHistoryVersion] = useState(0);

  const refreshHistory = () => setHistoryVersion((version) => version + 1);

  return (
    <section className="workspace">
      <nav className="tabs" aria-label="生成工具">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? "tab active" : "tab"}
            type="button"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "script" && <ScriptTool onSaved={refreshHistory} />}
      {activeTab === "image" && <ImageTool onSaved={refreshHistory} />}
      {activeTab === "video" && <VideoTool onSaved={refreshHistory} />}
      {activeTab === "history" && <HistoryPanel version={historyVersion} onCleared={refreshHistory} />}
    </section>
  );
}

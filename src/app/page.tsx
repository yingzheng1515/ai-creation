import { ToolTabs } from "@/components/ToolTabs";

export default function HomePage() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">创作控制台</p>
          <h1>自动创作工作台</h1>
          <p className="subtitle">把脚本、图片和视频生成入口放在一个轻量工作台里。</p>
        </div>
        <div className="status-cluster" aria-label="当前状态">
          <span className="status-pill">Mock API</span>
          <span className="status-pill muted">本地历史</span>
        </div>
      </header>
      <ToolTabs />
    </main>
  );
}

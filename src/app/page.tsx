import { ToolTabs } from "@/components/ToolTabs";

export default function HomePage() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">AI Creation MVP</p>
          <h1>自动创作工作台</h1>
          <p className="subtitle">三个独立工具：写脚本、生图、生视频。首版使用可替换 mock API。</p>
        </div>
      </header>
      <ToolTabs />
    </main>
  );
}

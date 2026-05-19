import { ToolTabs } from "@/components/ToolTabs";

export default function HomePage() {
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
            <ToolTabs />
          </section>

          <section className="flow-steps" aria-label="自动化流程">
            <div className="step done">
              <span>壹</span>
              <strong>剧本分镜</strong>
            </div>
            <div className="step current">
              <span>贰</span>
              <strong>画面生成</strong>
            </div>
            <div className="step">
              <span>叁</span>
              <strong>视频合成</strong>
            </div>
          </section>

          <section className="scene-stack" aria-label="场景流">
            <article className="scene-card">
              <header className="scene-head">
                <strong>镜 01</strong>
                <span>远景 / 黎明</span>
              </header>
              <div className="scene-grid">
                <div className="scene-column script-column">
                  <div className="column-label">Script</div>
                  <p>晨雾缭绕在连绵的群山之间。镜头缓缓推进，一袭白衣的剑客立于悬崖之巅，衣袂随风飘动。</p>
                </div>
                <div className="scene-column image-column">
                  <div className="column-label success">Image · 完成</div>
                  <div className="image-preview-card">水墨山水 · 白衣剑客</div>
                </div>
                <div className="scene-column video-column">
                  <div className="column-label">Video</div>
                  <button className="dashed-action" type="button">
                    <span>生成动态视频</span>
                    <small>耗费 50 灵力</small>
                  </button>
                </div>
              </div>
            </article>

            <article className="scene-card active-scene">
              <header className="scene-head">
                <strong>镜 02</strong>
                <span>特写 / 动势</span>
              </header>
              <div className="scene-grid">
                <div className="scene-column script-column">
                  <div className="column-label">Script</div>
                  <p>镜头急推至剑客手部。他缓缓拔剑出鞘，剑身映照着晨光，反射出冷冽的寒芒。</p>
                </div>
                <div className="scene-column image-column">
                  <div className="loading-art">
                    <span className="scan-line" />
                    <strong>丹青泼墨中</strong>
                    <small>45%</small>
                  </div>
                </div>
                <div className="scene-column video-column muted">
                  <div className="dashed-action locked">
                    <span>等待画卷完成</span>
                  </div>
                </div>
              </div>
            </article>

            <button className="add-scene" type="button">撰写新镜</button>
          </section>
        </div>

        <footer className="bottom-bar">
          <span>当前工作流节点：2/5 正在运行。预估剩余时间：1分20秒。</span>
          <div>
            <button className="ghost-button" type="button">中止衍化</button>
            <button className="gold-button" type="button">批量一键生成</button>
          </div>
        </footer>
      </main>
    </div>
  );
}

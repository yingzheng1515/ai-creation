"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { addHistoryEntry, getHistory } from "@/lib/history";
import { addProject, getProjects } from "@/lib/projects";
import { getSession, login, logout } from "@/lib/session-client";
import type { ClientSession } from "@/lib/session-client";
import type {
  GenerationResult,
  HistoryEntry,
  ImageResult,
  ScriptResult,
  ScriptScene,
  VideoResult,
} from "@/types/generation";
import type { CreationProject, ProjectScene } from "@/types/projects";
import { ToolTabs } from "./ToolTabs";
import { WorkflowScenes } from "./WorkflowScenes";

type PipelineStatus = "idle" | "script" | "image" | "video" | "done" | "error";
type WorkspaceView = "studio" | "works" | "assets" | "templates";

const navItems: Array<{ icon: string; label: string; view: WorkspaceView }> = [
  { icon: "层", label: "创作台", view: "studio" },
  { icon: "影", label: "我的作品", view: "works" },
  { icon: "图", label: "素材宝库", view: "assets" },
  { icon: "卷", label: "剧本模板", view: "templates" },
];

const scriptTemplates = [
  {
    name: "产品宣传片",
    prompt: "为一款 AI 自动创作工具写 30 秒产品宣传片，突出自动写脚本、生图、生视频的完整工作流。",
  },
  {
    name: "品牌故事",
    prompt: "写一支品牌故事短片，风格克制高级，三镜头结构，开场有钩子，结尾有行动号召。",
  },
  {
    name: "活动预热视频",
    prompt: "写一支活动预热视频，节奏紧凑，包含场景氛围、核心亮点和报名引导。",
  },
];

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

function projectTitleFromPrompt(prompt: string): string {
  const normalized = prompt.replace(/\s+/g, " ").trim();

  return normalized.length > 22 ? `${normalized.slice(0, 22)}...` : normalized;
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
  const [projectVersion, setProjectVersion] = useState(0);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [projects, setProjects] = useState<CreationProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [session, setSession] = useState<ClientSession>({ id: "unknown", label: "访客空间", isAuthenticated: false });
  const [accountName, setAccountName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [activeView, setActiveView] = useState<WorkspaceView>("studio");
  const [isTokenDetailsOpen, setIsTokenDetailsOpen] = useState(false);
  const [pipelinePrompt, setPipelinePrompt] = useState("");
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>("idle");
  const [pipelineError, setPipelineError] = useState("");

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
  }, [historyVersion]);

  useEffect(() => {
    let isCurrent = true;

    getProjects().then((loadedProjects) => {
      if (isCurrent) {
        setProjects(loadedProjects);
        setSelectedProjectId((currentProjectId) =>
          currentProjectId && loadedProjects.some((project) => project.id === currentProjectId) ? currentProjectId : null,
        );
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [projectVersion]);

  useEffect(() => {
    let isCurrent = true;

    getSession().then((loadedSession) => {
      if (isCurrent) {
        setSession(loadedSession);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  const refreshWorkflow = () => setHistoryVersion((version) => version + 1);
  const refreshProjects = () => setProjectVersion((version) => version + 1);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setIsAuthBusy(true);

    try {
      const nextSession = await login(accountName, accessCode);
      setSession(nextSession);
      setAccessCode("");
      refreshWorkflow();
      refreshProjects();
    } catch (caught) {
      setAuthError(caught instanceof Error ? caught.message : "登录失败。");
    } finally {
      setIsAuthBusy(false);
    }
  }

  async function handleLogout() {
    setAuthError("");
    setIsAuthBusy(true);

    try {
      const nextSession = await logout();
      setSession(nextSession);
      setAccountName("");
      setAccessCode("");
      refreshWorkflow();
      refreshProjects();
    } catch (caught) {
      setAuthError(caught instanceof Error ? caught.message : "退出失败。");
    } finally {
      setIsAuthBusy(false);
    }
  }

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
      await addHistoryEntry({ type: "script", input: prompt, result: script });
      refreshWorkflow();

      const scenes = scenesForPipeline(script);
      const imageResults = new Map<string, ImageResult>();
      const videoResults = new Map<string, VideoResult>();

      setPipelineStatus("image");
      for (const scene of scenes) {
        const image = await postGeneration<ImageResult>("/api/generate/image", { prompt: scene.imagePrompt });
        await addHistoryEntry({ type: "image", input: scene.imagePrompt, result: image });
        imageResults.set(scene.id, image);
        refreshWorkflow();
      }

      setPipelineStatus("video");
      for (const scene of scenes) {
        const video = await postGeneration<VideoResult>("/api/generate/video", { prompt: scene.videoPrompt });
        await addHistoryEntry({ type: "video", input: scene.videoPrompt, result: video });
        videoResults.set(scene.id, video);
        refreshWorkflow();
      }

      const projectScenes: ProjectScene[] = scenes.map((scene) => ({
        ...scene,
        image: imageResults.get(scene.id),
        status: imageResults.has(scene.id) && videoResults.has(scene.id) ? "done" : "partial",
        video: videoResults.get(scene.id),
      }));
      const savedProject = await addProject({
        title: projectTitleFromPrompt(prompt),
        prompt,
        status: projectScenes.every((scene) => scene.status === "done") ? "done" : "partial",
        script,
        scenes: projectScenes,
      });

      setProjects((currentProjects) => [savedProject, ...currentProjects.filter((project) => project.id !== savedProject.id)]);
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

  const imageAssets = entries.filter((entry) => entry.result.type === "image");
  const videoAssets = entries.filter((entry) => entry.result.type === "video");
  const selectedProject = selectedProjectId ? projects.find((project) => project.id === selectedProjectId) ?? null : null;

  function useTemplate(prompt: string) {
    setPipelinePrompt(prompt);
    setActiveView("studio");
  }

  function renderWorkspaceView() {
    if (activeView === "works") {
      if (selectedProject) {
        return (
          <section className="library-panel project-detail" aria-labelledby="project-detail-heading">
            <button className="secondary-button" type="button" onClick={() => setSelectedProjectId(null)}>
              返回作品列表
            </button>
            <div className="library-heading">
              <p className="section-kicker">Project</p>
              <h2 id="project-detail-heading">{selectedProject.title}</h2>
              <p>{selectedProject.prompt}</p>
            </div>
            <article className="project-script">
              <h3>脚本</h3>
              <p>{selectedProject.script.content}</p>
            </article>
            <div className="project-scene-list">
              {selectedProject.scenes.map((scene, index) => (
                <article className="project-scene-card" key={scene.id}>
                  <header>
                    <strong>镜 {String(index + 1).padStart(2, "0")}</strong>
                    <span>{scene.title} / {scene.durationSeconds} 秒</span>
                  </header>
                  <p>{scene.shot}</p>
                  {scene.image ? <img src={scene.image.url} alt={scene.image.prompt} /> : null}
                  {scene.video ? (
                    <video src={scene.video.url} controls>
                      <track kind="captions" />
                    </video>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        );
      }

      return (
        <section className="library-panel" aria-labelledby="works-heading">
          <div className="library-heading">
            <p className="section-kicker">Works</p>
            <h2 id="works-heading">我的作品</h2>
            <p>这里汇总一键生成的完整项目，换设备也能继续查看。</p>
          </div>
          {projects.length === 0 ? (
            <div className="result-empty">还没有项目。先回到创作台完成一次全链路生成。</div>
          ) : (
            <div className="library-list">
              {projects.map((project) => (
                <article className="library-item project-item" key={project.id}>
                  <div>
                    <strong>{project.title}</strong>
                    <p>{project.prompt}</p>
                    <span>{project.scenes.length} 个镜头</span>
                    <time>{new Date(project.createdAt).toLocaleString("zh-CN")}</time>
                  </div>
                  <button className="secondary-button" type="button" onClick={() => setSelectedProjectId(project.id)}>
                    打开项目
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      );
    }

    if (activeView === "assets") {
      return (
        <section className="library-panel" aria-labelledby="assets-heading">
          <div className="library-heading">
            <p className="section-kicker">Assets</p>
            <h2 id="assets-heading">素材宝库</h2>
            <p>图片和视频素材会在生成后自动沉淀到这里。</p>
          </div>
          {imageAssets.length + videoAssets.length === 0 ? (
            <div className="result-empty">还没有素材。生成图片或视频后会显示在这里。</div>
          ) : (
            <div className="asset-grid">
              {[...imageAssets, ...videoAssets].map((entry) => (
                <article className="asset-card" key={entry.id}>
                  {entry.result.type === "image" ? (
                    <img src={entry.result.url} alt={entry.result.prompt} />
                  ) : entry.result.type === "video" ? (
                    <video src={entry.result.url} controls>
                      <track kind="captions" />
                    </video>
                  ) : null}
                  <strong>{entry.result.type === "image" ? "图片素材" : "视频素材"}</strong>
                  <p>{entry.input}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      );
    }

    if (activeView === "templates") {
      return (
        <section className="library-panel" aria-labelledby="templates-heading">
          <div className="library-heading">
            <p className="section-kicker">Templates</p>
            <h2 id="templates-heading">剧本模板</h2>
            <p>选择一个模板后，会自动填入核心创意，你可以继续修改再生成。</p>
          </div>
          <div className="template-grid">
            {scriptTemplates.map((template) => (
              <article className="template-card" key={template.name}>
                <h3>{template.name}</h3>
                <p>{template.prompt}</p>
                <button className="secondary-button" type="button" onClick={() => useTemplate(template.prompt)}>
                  使用 {template.name} 模板
                </button>
              </article>
            ))}
          </div>
        </section>
      );
    }

    return (
      <>
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
      </>
    );
  }

  return (
    <div className="app-frame">
      <aside className="sidebar" aria-label="主导航">
        <div className="brand">
          <div className="brand-mark">造</div>
          <span>造物纪 AI</span>
        </div>

        <nav className="side-nav" aria-label="工作区">
          {navItems.map((item) => (
            <button
              className={activeView === item.view ? "side-link active" : "side-link"}
              type="button"
              aria-current={activeView === item.view ? "page" : undefined}
              onClick={() => setActiveView(item.view)}
              key={item.view}
            >
              <span className="side-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="usage-card">
          <button
            className="usage-toggle"
            type="button"
            aria-expanded={isTokenDetailsOpen}
            onClick={() => setIsTokenDetailsOpen((isOpen) => !isOpen)}
          >
            <span>灵力 Token</span>
            <strong>8,240</strong>
          </button>
          {isTokenDetailsOpen ? (
            <div className="usage-details">
              <p>Token 是生成脚本、图片和视频时预估消耗的额度。</p>
              <dl>
                <div>
                  <dt>已用</dt>
                  <dd>45%</dd>
                </div>
                <div>
                  <dt>剩余</dt>
                  <dd>8,240</dd>
                </div>
              </dl>
            </div>
          ) : null}
          <div className="usage-track" aria-label="Token 使用进度">
            <span />
          </div>
          <div className="user-chip">
            <span className="avatar-mark">人</span>
            <span>{session.label}</span>
          </div>
          {session.isAuthenticated ? (
            <button className="secondary-button account-action" type="button" onClick={handleLogout} disabled={isAuthBusy}>
              退出登录
            </button>
          ) : (
            <form className="account-form" onSubmit={handleLogin}>
              <label>
                <span>账号名</span>
                <input
                  value={accountName}
                  onChange={(event) => setAccountName(event.target.value)}
                  placeholder="例如 Creator"
                  autoComplete="username"
                />
              </label>
              <label>
                <span>访问码</span>
                <input
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value)}
                  placeholder="至少 6 位"
                  type="password"
                  autoComplete="current-password"
                />
              </label>
              {authError ? <p className="auth-error">{authError}</p> : null}
              <button className="secondary-button account-action" type="submit" disabled={isAuthBusy}>
                {isAuthBusy ? "处理中..." : "登录 / 创建账号"}
              </button>
            </form>
          )}
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

        <div className="stage-scroll">{renderWorkspaceView()}</div>

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

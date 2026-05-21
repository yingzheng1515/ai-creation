"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { addHistoryEntry, getHistory } from "@/lib/history";
import { addProject, getProjects } from "@/lib/projects";
import { getSession, login, logout, register } from "@/lib/session-client";
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
type PipelineStage = "script" | "image" | "video";
type PipelineStepStatus = "pending" | "running" | "done" | "failed";
type WorkspaceView = "studio" | "works" | "assets" | "templates";
type AuthMode = "login" | "register";

type PipelineStep = {
  detail: string;
  status: PipelineStepStatus;
};

type PipelineSteps = Record<PipelineStage, PipelineStep>;

type PipelineDraft = {
  failedStage?: PipelineStage;
  imageResults: Record<string, ImageResult>;
  prompt: string;
  scenes: ScriptScene[];
  script?: ScriptResult;
  videoResults: Record<string, VideoResult>;
};

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

const pipelineStages: Array<{ failed: string; id: PipelineStage; label: string; running: string }> = [
  { id: "script", label: "剧本分镜", running: "正在衍化剧本", failed: "剧本分镜失败" },
  { id: "image", label: "画面生成", running: "正在生成画面", failed: "画面生成失败" },
  { id: "video", label: "视频合成", running: "正在合成视频", failed: "视频合成失败" },
];
const authRequiredMessage = "请先登录或创建账号后再继续。";

function initialPipelineSteps(): PipelineSteps {
  return {
    script: { detail: "等待输入核心创意", status: "pending" },
    image: { detail: "等待剧本完成", status: "pending" },
    video: { detail: "等待画面完成", status: "pending" },
  };
}

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
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authError, setAuthError] = useState("");
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [activeView, setActiveView] = useState<WorkspaceView>("studio");
  const [isTokenDetailsOpen, setIsTokenDetailsOpen] = useState(false);
  const [pipelinePrompt, setPipelinePrompt] = useState("");
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>("idle");
  const [pipelineError, setPipelineError] = useState("");
  const [pipelineSteps, setPipelineSteps] = useState<PipelineSteps>(() => initialPipelineSteps());
  const [pipelineDraft, setPipelineDraft] = useState<PipelineDraft | null>(null);

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

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setIsAuthBusy(true);

    try {
      const nextSession = authMode === "register"
        ? await register(accountName, accessCode)
        : await login(accountName, accessCode);
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

  function setPipelineStep(stage: PipelineStage, nextStep: Partial<PipelineStep>) {
    setPipelineSteps((currentSteps) => ({
      ...currentSteps,
      [stage]: {
        ...currentSteps[stage],
        ...nextStep,
      },
    }));
  }

  function seedPipelineSteps(stage: PipelineStage, draft?: PipelineDraft): PipelineSteps {
    const nextSteps = initialPipelineSteps();

    if (draft?.script) {
      nextSteps.script = { detail: "剧本已生成", status: "done" };
    }

    if (draft && draft.scenes.length > 0 && draft.scenes.every((scene) => draft.imageResults[scene.id])) {
      nextSteps.image = { detail: "画面已生成", status: "done" };
    }

    if (draft && draft.scenes.length > 0 && draft.scenes.every((scene) => draft.videoResults[scene.id])) {
      nextSteps.video = { detail: "视频已合成", status: "done" };
    }

    nextSteps[stage] = {
      detail: pipelineStages.find((item) => item.id === stage)?.running ?? "正在处理",
      status: "running",
    };

    return nextSteps;
  }

  async function saveProjectFromDraft(draft: PipelineDraft) {
    if (!draft.script) {
      return null;
    }

    const projectScenes: ProjectScene[] = draft.scenes.map((scene) => ({
      ...scene,
      image: draft.imageResults[scene.id],
      status: draft.imageResults[scene.id] && draft.videoResults[scene.id] ? "done" : "partial",
      video: draft.videoResults[scene.id],
    }));
    const savedProject = await addProject({
      title: projectTitleFromPrompt(draft.prompt),
      prompt: draft.prompt,
      status: projectScenes.every((scene) => scene.status === "done") ? "done" : "partial",
      script: draft.script,
      scenes: projectScenes,
    });

    setProjects((currentProjects) => [savedProject, ...currentProjects.filter((project) => project.id !== savedProject.id)]);

    return savedProject;
  }

  async function executePipeline(startStage: PipelineStage, existingDraft?: PipelineDraft) {
    if (!session.isAuthenticated) {
      setPipelineStatus("error");
      setPipelineError(authRequiredMessage);
      setPipelineSteps({
        ...initialPipelineSteps(),
        script: { detail: authRequiredMessage, status: "failed" },
      });
      return;
    }

    const prompt = (existingDraft?.prompt ?? pipelinePrompt).trim();
    if (!prompt) {
      setPipelineStatus("error");
      setPipelineError("请输入核心创意。");
      setPipelineSteps({
        ...initialPipelineSteps(),
        script: { detail: "请输入核心创意。", status: "failed" },
      });
      return;
    }

    const draft: PipelineDraft = existingDraft
      ? {
          ...existingDraft,
          failedStage: undefined,
          imageResults: { ...existingDraft.imageResults },
          videoResults: { ...existingDraft.videoResults },
        }
      : { imageResults: {}, prompt, scenes: [], videoResults: {} };
    let currentStage: PipelineStage = startStage;

    setPipelineError("");
    setPipelineDraft(draft);
    setPipelineSteps(seedPipelineSteps(startStage, draft));

    try {
      if (startStage === "script") {
        currentStage = "script";
        setPipelineStatus("script");
        setPipelineStep("script", { detail: "正在衍化剧本", status: "running" });
        const script = await postGeneration<ScriptResult>("/api/generate/script", { requirement: prompt });
        await addHistoryEntry({ type: "script", input: prompt, result: script });
        draft.script = script;
        draft.scenes = scenesForPipeline(script);
        draft.imageResults = {};
        draft.videoResults = {};
        setPipelineDraft({ ...draft });
        setPipelineStep("script", { detail: "剧本已生成", status: "done" });
        refreshWorkflow();
      }

      if (!draft.script || draft.scenes.length === 0) {
        throw new Error("剧本没有返回可用场景。");
      }

      if (startStage === "script" || startStage === "image") {
        currentStage = "image";
        setPipelineStatus("image");
        setPipelineStep("image", { detail: "正在生成画面", status: "running" });
      }
      for (const scene of draft.scenes) {
        if (draft.imageResults[scene.id]) {
          continue;
        }

        const image = await postGeneration<ImageResult>("/api/generate/image", { prompt: scene.imagePrompt });
        await addHistoryEntry({ type: "image", input: scene.imagePrompt, result: image });
        draft.imageResults[scene.id] = image;
        setPipelineDraft({ ...draft, imageResults: { ...draft.imageResults } });
        refreshWorkflow();
      }
      setPipelineStep("image", { detail: "画面已生成", status: "done" });

      currentStage = "video";
      setPipelineStatus("video");
      setPipelineStep("video", { detail: "正在合成视频", status: "running" });
      for (const scene of draft.scenes) {
        if (draft.videoResults[scene.id]) {
          continue;
        }

        const video = await postGeneration<VideoResult>("/api/generate/video", { prompt: scene.videoPrompt });
        await addHistoryEntry({ type: "video", input: scene.videoPrompt, result: video });
        draft.videoResults[scene.id] = video;
        setPipelineDraft({ ...draft, videoResults: { ...draft.videoResults } });
        refreshWorkflow();
      }
      setPipelineStep("video", { detail: "视频已合成", status: "done" });

      await saveProjectFromDraft(draft);
      setPipelineDraft({ ...draft, failedStage: undefined });
      setPipelineStatus("done");
    } catch (caught) {
      const errorMessage = caught instanceof Error ? caught.message : "全链路生成失败。";
      const failedLabel = pipelineStages.find((stage) => stage.id === currentStage)?.failed ?? "生成失败";

      draft.failedStage = currentStage;
      setPipelineDraft({ ...draft });
      setPipelineStatus("error");
      setPipelineStep(currentStage, { detail: errorMessage, status: "failed" });
      setPipelineError(`${failedLabel}：${errorMessage}`);
    }
  }

  async function runPipeline() {
    await executePipeline("script");
  }

  async function retryFailedPipelineStep() {
    if (!pipelineDraft?.failedStage) {
      return;
    }

    await executePipeline(pipelineDraft.failedStage, pipelineDraft);
  }

  const isPipelineRunning = pipelineStatus === "script" || pipelineStatus === "image" || pipelineStatus === "video";
  const failedPipelineStage = pipelineDraft?.failedStage;
  const failedPipelineStageLabel = failedPipelineStage
    ? pipelineStages.find((stage) => stage.id === failedPipelineStage)?.failed ?? "生成失败"
    : null;

  const pipelineStatusText: Record<PipelineStatus, string> = {
    idle: "等待输入核心创意",
    script: "正在衍化剧本",
    image: "正在生成画面",
    video: "正在合成视频",
    done: "全链路完成",
    error: failedPipelineStageLabel || pipelineError || "全链路生成失败",
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
            <div className="result-empty">
              {session.isAuthenticated ? "还没有项目。先回到创作台完成一次全链路生成。" : "登录后可以查看和保存你的作品。"}
            </div>
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
            <div className="result-empty">
              {session.isAuthenticated ? "还没有素材。生成图片或视频后会显示在这里。" : "登录后可以查看生成的图片和视频素材。"}
            </div>
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
              {failedPipelineStage ? (
                <button className="secondary-button" type="button" onClick={retryFailedPipelineStep} disabled={isPipelineRunning}>
                  重试失败步骤
                </button>
              ) : null}
              <span className={pipelineStatus === "error" ? "pipeline-status error-text" : "pipeline-status"}>
                {pipelineStatusText[pipelineStatus]}
              </span>
            </div>
            {!session.isAuthenticated ? <p className="auth-required-note">{authRequiredMessage}</p> : null}
            <div className="pipeline-task-list" aria-label="任务状态">
              {pipelineStages.map((stage) => (
                <article className={`pipeline-task ${pipelineSteps[stage.id].status}`} key={stage.id}>
                  <strong>{stage.label}</strong>
                  <span>{pipelineSteps[stage.id].detail}</span>
                </article>
              ))}
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
            <form className="account-form" onSubmit={handleAuthSubmit}>
              <div className="account-mode-switch" aria-label="账号操作">
                <button
                  className={authMode === "login" ? "active" : ""}
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError("");
                  }}
                >
                  登录
                </button>
                <button
                  className={authMode === "register" ? "active" : ""}
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setAuthError("");
                  }}
                >
                  注册
                </button>
              </div>
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
                  autoComplete={authMode === "register" ? "new-password" : "current-password"}
                />
              </label>
              {authError ? <p className="auth-error">{authError}</p> : null}
              <button className="secondary-button account-action" type="submit" disabled={isAuthBusy}>
                {isAuthBusy ? "处理中..." : authMode === "register" ? "注册并进入" : "登录账号"}
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

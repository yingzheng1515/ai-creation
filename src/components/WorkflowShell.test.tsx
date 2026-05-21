import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkflowShell } from "./WorkflowShell";

describe("WorkflowShell", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("runs the full script-image-video pipeline from one prompt", async () => {
    const script = {
      type: "script",
      content: "镜头从江南水面推入。",
      scenes: [
        {
          id: "scene-1",
          title: "晨雾入画",
          shot: "镜头从江南水面推入。",
          narration: "江南醒来。",
          imagePrompt: "第一镜图片提示",
          videoPrompt: "第一镜视频提示",
          durationSeconds: 4,
        },
        {
          id: "scene-2",
          title: "乌篷船过桥",
          shot: "乌篷船穿过拱桥。",
          narration: "水路把故事带向远方。",
          imagePrompt: "第二镜图片提示",
          videoPrompt: "第二镜视频提示",
          durationSeconds: 5,
        },
      ],
      provider: "mock",
      createdAt: "2026-05-19T00:00:00.000Z",
    };
    const imageOne = {
      type: "image",
      url: "https://example.com/scene-1.jpg",
      prompt: "第一镜图片提示",
      provider: "mock",
      createdAt: "2026-05-19T00:00:01.000Z",
    };
    const imageTwo = {
      type: "image",
      url: "https://example.com/scene-2.jpg",
      prompt: "第二镜图片提示",
      provider: "mock",
      createdAt: "2026-05-19T00:00:02.000Z",
    };
    const videoOne = {
      type: "video",
      url: "https://example.com/scene-1.mp4",
      prompt: "第一镜视频提示",
      provider: "mock",
      createdAt: "2026-05-19T00:00:03.000Z",
    };
    const videoTwo = {
      type: "video",
      url: "https://example.com/scene-2.mp4",
      prompt: "第二镜视频提示",
      provider: "mock",
      createdAt: "2026-05-19T00:00:04.000Z",
    };
    const savedEntries: unknown[] = [];
    const savedProjects: unknown[] = [];
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const path = String(url);

      if (path === "/api/projects" && init?.method === "POST") {
        const body = JSON.parse(String(init.body));
        const saved = {
          id: "project-1",
          createdAt: "2026-05-19T00:00:05.000Z",
          updatedAt: "2026-05-19T00:00:05.000Z",
          ...body,
        };
        savedProjects.unshift(saved);

        return {
          ok: true,
          json: async () => saved,
        };
      }

      if (path === "/api/projects") {
        return { ok: true, json: async () => ({ projects: savedProjects }) };
      }

      if (path === "/api/history" && init?.method === "POST") {
        const body = JSON.parse(String(init.body));
        const saved = {
          id: `saved-${body.type}-${body.input}`,
          provider: body.result.provider,
          createdAt: body.result.createdAt,
          ...body,
        };
        savedEntries.unshift(saved);

        return {
          ok: true,
          json: async () => saved,
        };
      }

      if (path === "/api/history") {
        return { ok: true, json: async () => ({ entries: savedEntries }) };
      }

      if (path === "/api/session") {
        return { ok: true, json: async () => ({ user: { id: "acct_test123", label: "Creator", isAuthenticated: true } }) };
      }

      if (path === "/api/generate/script") {
        return { ok: true, json: async () => script };
      }

      if (path === "/api/generate/image") {
        const body = JSON.parse(String(init?.body));
        return { ok: true, json: async () => (body.prompt === "第一镜图片提示" ? imageOne : imageTwo) };
      }

      if (path === "/api/generate/video") {
        const body = JSON.parse(String(init?.body));
        return { ok: true, json: async () => (body.prompt === "第一镜视频提示" ? videoOne : videoTwo) };
      }

      throw new Error(`Unhandled fetch: ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<WorkflowShell />);

    expect(await screen.findByText("Creator")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("核心创意"), "水墨江南宣传片");
    await userEvent.click(screen.getByRole("button", { name: "一键衍化全链路" }));

    expect(await screen.findByText("全链路完成")).toBeInTheDocument();
    expect(screen.getByText("镜头从江南水面推入。")).toBeInTheDocument();
    expect(screen.getByText("乌篷船过桥")).toBeInTheDocument();
    expect(screen.getByAltText("第一镜图片提示")).toHaveAttribute("src", "https://example.com/scene-1.jpg");
    expect(screen.getByAltText("第二镜图片提示")).toHaveAttribute("src", "https://example.com/scene-2.jpg");
    expect(screen.getAllByTestId("workflow-video")).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generate/script",
      expect.objectContaining({ body: JSON.stringify({ requirement: "水墨江南宣传片" }) }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generate/image",
      expect.objectContaining({ body: JSON.stringify({ prompt: "第一镜图片提示" }) }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generate/image",
      expect.objectContaining({ body: JSON.stringify({ prompt: "第二镜图片提示" }) }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generate/video",
      expect.objectContaining({ body: JSON.stringify({ prompt: "第一镜视频提示" }) }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generate/video",
      expect.objectContaining({ body: JSON.stringify({ prompt: "第二镜视频提示" }) }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/projects",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("水墨江南宣传片"),
      }),
    );

    await userEvent.click(screen.getByRole("button", { name: /我的作品/ }));
    expect(screen.getByRole("heading", { name: "我的作品" })).toBeInTheDocument();
    expect(screen.getAllByText("水墨江南宣传片").length).toBeGreaterThan(0);
    expect(screen.getByText("2 个镜头")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "打开项目" }));
    expect(screen.getByRole("heading", { name: "水墨江南宣传片" })).toBeInTheDocument();
    expect(screen.getByText("脚本")).toBeInTheDocument();
  });

  it("shows the failed pipeline stage and retries from the failed step", async () => {
    const script = {
      type: "script",
      content: "镜头从江南水面推入。",
      scenes: [
        {
          id: "scene-1",
          title: "晨雾入画",
          shot: "镜头从江南水面推入。",
          narration: "江南醒来。",
          imagePrompt: "第一镜图片提示",
          videoPrompt: "第一镜视频提示",
          durationSeconds: 4,
        },
      ],
      provider: "mock",
      createdAt: "2026-05-19T00:00:00.000Z",
    };
    const image = {
      type: "image",
      url: "https://example.com/scene-1.jpg",
      prompt: "第一镜图片提示",
      provider: "mock",
      createdAt: "2026-05-19T00:00:01.000Z",
    };
    const video = {
      type: "video",
      url: "https://example.com/scene-1.mp4",
      prompt: "第一镜视频提示",
      provider: "mock",
      createdAt: "2026-05-19T00:00:02.000Z",
    };
    let imageAttempts = 0;
    const savedEntries: unknown[] = [];
    const savedProjects: unknown[] = [];
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const path = String(url);

      if (path === "/api/session") {
        return { ok: true, json: async () => ({ user: { id: "acct_test123", label: "Creator", isAuthenticated: true } }) };
      }

      if (path === "/api/history" && init?.method === "POST") {
        const body = JSON.parse(String(init.body));
        const saved = {
          id: `saved-${body.type}-${body.input}`,
          provider: body.result.provider,
          createdAt: body.result.createdAt,
          ...body,
        };
        savedEntries.unshift(saved);

        return { ok: true, json: async () => saved };
      }

      if (path === "/api/history") {
        return { ok: true, json: async () => ({ entries: savedEntries }) };
      }

      if (path === "/api/projects" && init?.method === "POST") {
        const body = JSON.parse(String(init.body));
        const saved = {
          id: "project-1",
          createdAt: "2026-05-19T00:00:03.000Z",
          updatedAt: "2026-05-19T00:00:03.000Z",
          ...body,
        };
        savedProjects.unshift(saved);

        return { ok: true, json: async () => saved };
      }

      if (path === "/api/projects") {
        return { ok: true, json: async () => ({ projects: savedProjects }) };
      }

      if (path === "/api/generate/script") {
        return { ok: true, json: async () => script };
      }

      if (path === "/api/generate/image") {
        imageAttempts += 1;

        if (imageAttempts === 1) {
          return { ok: false, json: async () => ({ error: "OpenAI image timeout" }) };
        }

        return { ok: true, json: async () => image };
      }

      if (path === "/api/generate/video") {
        return { ok: true, json: async () => video };
      }

      throw new Error(`Unhandled fetch: ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<WorkflowShell />);

    expect(await screen.findByText("Creator")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("核心创意"), "水墨江南宣传片");
    await userEvent.click(screen.getByRole("button", { name: "一键衍化全链路" }));

    expect(await screen.findByText("画面生成失败")).toBeInTheDocument();
    expect(screen.getByText("OpenAI image timeout")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重试失败步骤" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "重试失败步骤" }));

    expect(await screen.findByText("全链路完成")).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([url]) => String(url) === "/api/generate/script")).toHaveLength(1);
    expect(fetchMock.mock.calls.filter(([url]) => String(url) === "/api/generate/image")).toHaveLength(2);
    expect(fetchMock.mock.calls.filter(([url]) => String(url) === "/api/generate/video")).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generate/script",
      expect.objectContaining({ body: JSON.stringify({ requirement: "水墨江南宣传片" }) }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generate/image",
      expect.objectContaining({ body: JSON.stringify({ prompt: "第一镜图片提示" }) }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generate/video",
      expect.objectContaining({ body: JSON.stringify({ prompt: "第一镜视频提示" }) }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/projects",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("水墨江南宣传片"),
      }),
    );
  });

  it("switches sidebar sections and explains token usage", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL | Request) => {
        const path = String(url);

        if (path === "/api/session") {
          return { ok: true, json: async () => ({ user: { id: "usr_test123", label: "访客 est123" } }) };
        }

        return { ok: true, json: async () => ({ entries: [] }) };
      }),
    );

    render(<WorkflowShell />);

    expect(await screen.findByText("访客 est123")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /我的作品/ }));
    expect(screen.getByRole("heading", { name: "我的作品" })).toBeInTheDocument();
    expect(screen.getByText("这里汇总一键生成的完整项目，换设备也能继续查看。")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /素材宝库/ }));
    expect(screen.getByRole("heading", { name: "素材宝库" })).toBeInTheDocument();
    expect(screen.getByText("图片和视频素材会在生成后自动沉淀到这里。")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /剧本模板/ }));
    expect(screen.getByRole("heading", { name: "剧本模板" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "使用 产品宣传片 模板" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /灵力 Token/ }));
    expect(screen.getByText("Token 是生成脚本、图片和视频时预估消耗的额度。")).toBeInTheDocument();
  });

  it("asks visitors to log in before running the pipeline", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const path = String(url);

      if (path === "/api/session") {
        return { ok: true, json: async () => ({ user: { id: "usr_test123", label: "访客 est123", isAuthenticated: false } }) };
      }

      if (path === "/api/history" || path === "/api/projects") {
        return { ok: false, json: async () => ({ error: "请先登录后再继续。" }) };
      }

      throw new Error(`Unhandled fetch: ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<WorkflowShell />);

    expect(await screen.findByText("访客 est123")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("核心创意"), "水墨江南宣传片");
    await userEvent.click(screen.getByRole("button", { name: "一键衍化全链路" }));

    expect(screen.getAllByText("请先登录或创建账号后再继续。").length).toBeGreaterThan(0);
    expect(fetchMock.mock.calls.some(([url]) => String(url) === "/api/generate/script")).toBe(false);
  });

  it("logs in and logs out from the sidebar account panel", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const path = String(url);

      if (path === "/api/session") {
        return { ok: true, json: async () => ({ user: { id: "usr_test123", label: "访客 est123", isAuthenticated: false } }) };
      }

      if (path === "/api/auth/login" && init?.method === "POST") {
        return {
          ok: true,
          json: async () => ({
            user: {
              id: "acct_test123",
              label: "Creator",
              accountName: "creator",
              isAuthenticated: true,
            },
          }),
        };
      }

      if (path === "/api/auth/logout" && init?.method === "POST") {
        return { ok: true, json: async () => ({ user: { id: "usr_next123", label: "访客 ext123", isAuthenticated: false } }) };
      }

      if (path === "/api/history") {
        return { ok: true, json: async () => ({ entries: [] }) };
      }

      throw new Error(`Unhandled fetch: ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<WorkflowShell />);

    expect(await screen.findByText("访客 est123")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("账号名"), "Creator");
    await userEvent.type(screen.getByLabelText("访问码"), "open-2026");
    await userEvent.click(screen.getByRole("button", { name: "登录 / 创建账号" }));

    expect(await screen.findByText("Creator")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ accountName: "Creator", accessCode: "open-2026" }),
      }),
    );

    await userEvent.click(screen.getByRole("button", { name: "退出登录" }));

    expect(await screen.findByText("访客 ext123")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({ method: "POST" }));
  });

  it("renders when server history contains obsolete entries", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ entries: [{ id: "obsolete", type: "image", input: "旧缓存" }] }),
      })),
    );

    render(<WorkflowShell />);

    expect(screen.getByRole("heading", { name: "初始灵感 Prompt" })).toBeInTheDocument();
    expect(await screen.findByText("等待脚本生成")).toBeInTheDocument();
  });
});

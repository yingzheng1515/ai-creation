import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET, POST } from "./route";
import { AUTH_REQUIRED_MESSAGE, createAccountSessionCookie } from "@/lib/session";
import type { NewCreationProject } from "@/types/projects";

const script = {
  type: "script",
  content: "项目脚本",
  scenes: [
    {
      id: "scene-1",
      title: "第一镜",
      shot: "镜头推进。",
      narration: "",
      imagePrompt: "第一镜图片",
      videoPrompt: "第一镜视频",
      durationSeconds: 4,
    },
  ],
  provider: "mock",
  createdAt: "2026-05-20T00:00:00.000Z",
} as const;

const project: NewCreationProject = {
  title: "项目化测试",
  prompt: "做一个项目",
  status: "done",
  script,
  scenes: [
    {
      ...script.scenes[0],
      status: "done",
      image: {
        type: "image",
        url: "https://example.com/image.jpg",
        prompt: "第一镜图片",
        provider: "mock",
        createdAt: "2026-05-20T00:00:01.000Z",
      },
    },
  ],
};

const authCookie = (userId = "acct_1234567890abcdef12345678") =>
  createAccountSessionCookie(userId, new Request("http://localhost/api/projects"));

const postRequest = (body: unknown, cookie = authCookie()) =>
  new Request("http://localhost/api/projects", {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify(body),
  });

const getRequest = (cookie = authCookie()) =>
  new Request("http://localhost/api/projects", {
    headers: { cookie },
  });

describe("projects API route", () => {
  let tempDir = "";
  const originalHistoryDataDir = process.env.HISTORY_DATA_DIR;
  const originalSessionSecret = process.env.SESSION_SECRET;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ai-projects-api-"));
    process.env.HISTORY_DATA_DIR = tempDir;
    process.env.SESSION_SECRET = "test-session-secret";
  });

  afterEach(async () => {
    if (originalHistoryDataDir === undefined) {
      delete process.env.HISTORY_DATA_DIR;
    } else {
      process.env.HISTORY_DATA_DIR = originalHistoryDataDir;
    }

    if (originalSessionSecret === undefined) {
      delete process.env.SESSION_SECRET;
    } else {
      process.env.SESSION_SECRET = originalSessionSecret;
    }

    await rm(tempDir, { recursive: true, force: true });
  });

  it("creates and lists projects for the current session", async () => {
    const createResponse = await POST(postRequest(project));
    const saved = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(saved.id).toMatch(/^project_/);
    expect(saved.title).toBe("项目化测试");

    const listResponse = await GET(getRequest());
    const listed = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(listed.projects).toEqual([saved]);
  });

  it("rejects visitor project access", async () => {
    const response = await GET(getRequest("ai_creation_session=usr_projects"));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe(AUTH_REQUIRED_MESSAGE);
  });

  it("rejects malformed projects", async () => {
    const response = await POST(postRequest({ title: "坏项目" }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Invalid project.");
  });
});

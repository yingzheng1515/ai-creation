import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { addProjectToStore, listProjects } from "./project-store";
import type { NewCreationProject } from "@/types/projects";

const script = {
  type: "script",
  content: "第一版宣传片脚本",
  scenes: [
    {
      id: "scene-1",
      title: "开场",
      shot: "水面推镜。",
      narration: "江南醒来。",
      imagePrompt: "水墨江南图片",
      videoPrompt: "水墨江南视频",
      durationSeconds: 4,
    },
  ],
  provider: "mock",
  createdAt: "2026-05-20T00:00:00.000Z",
} as const;

const project: NewCreationProject = {
  title: "水墨江南宣传片",
  prompt: "做一支水墨江南宣传片",
  status: "done",
  script,
  scenes: [
    {
      ...script.scenes[0],
      status: "done",
      image: {
        type: "image",
        url: "https://example.com/scene.jpg",
        prompt: "水墨江南图片",
        provider: "mock",
        createdAt: "2026-05-20T00:00:01.000Z",
      },
      video: {
        type: "video",
        url: "https://example.com/scene.mp4",
        prompt: "水墨江南视频",
        provider: "mock",
        createdAt: "2026-05-20T00:00:02.000Z",
      },
    },
  ],
};

describe("project store", () => {
  let tempDir = "";
  const originalHistoryDataDir = process.env.HISTORY_DATA_DIR;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ai-projects-"));
    process.env.HISTORY_DATA_DIR = tempDir;
  });

  afterEach(async () => {
    if (originalHistoryDataDir === undefined) {
      delete process.env.HISTORY_DATA_DIR;
    } else {
      process.env.HISTORY_DATA_DIR = originalHistoryDataDir;
    }

    await rm(tempDir, { recursive: true, force: true });
  });

  it("saves and lists projects for a user", async () => {
    const saved = await addProjectToStore("usr_one", project);
    const listed = await listProjects("usr_one");

    expect(saved.id).toMatch(/^project_/);
    expect(saved.title).toBe("水墨江南宣传片");
    expect(saved.prompt).toBe("做一支水墨江南宣传片");
    expect(saved.scenes[0].image?.url).toBe("https://example.com/scene.jpg");
    expect(saved.scenes[0].video?.url).toBe("https://example.com/scene.mp4");
    expect(listed).toEqual([saved]);
  });

  it("keeps projects isolated by user", async () => {
    await addProjectToStore("usr_one", project);
    await addProjectToStore("usr_two", { ...project, title: "另一个项目" });

    expect(await listProjects("usr_one")).toEqual([
      expect.objectContaining({ title: "水墨江南宣传片" }),
    ]);
    expect(await listProjects("usr_two")).toEqual([
      expect.objectContaining({ title: "另一个项目" }),
    ]);
  });
});

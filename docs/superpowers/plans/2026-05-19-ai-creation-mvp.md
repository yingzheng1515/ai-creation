# AI Creation MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js MVP with three independent AI creation tools: script generation, image generation, and video generation.

**Architecture:** Use a single Next.js App Router project. Browser components call three API routes, API routes call replaceable mock providers, and successful generations are saved to browser `localStorage`.

**Tech Stack:** Next.js 15, React 19, TypeScript, Vitest, Testing Library, CSS Modules/global CSS, browser `localStorage`.

---

## File Structure

- Create `package.json`: npm scripts, Next dependencies, test dependencies.
- Create `tsconfig.json`: strict TypeScript settings for Next.js.
- Create `next.config.ts`: minimal Next config.
- Create `vitest.config.ts`: unit/component test config with jsdom.
- Create `src/app/layout.tsx`: root document shell and metadata.
- Create `src/app/page.tsx`: home page wrapper.
- Create `src/app/globals.css`: compact tabbed-workspace styling.
- Create `src/types/generation.ts`: shared API and history types.
- Create `src/lib/providers/types.ts`: provider input and output contracts.
- Create `src/lib/providers/mock.ts`: deterministic mock provider implementations.
- Create `src/lib/api/validation.ts`: JSON parsing and prompt validation helpers.
- Create `src/lib/history.ts`: localStorage history helpers.
- Create `src/components/ToolTabs.tsx`: client tab state and tool layout.
- Create `src/components/ResultCard.tsx`: shared result rendering.
- Create `src/components/ScriptTool.tsx`: script form, API call, result save.
- Create `src/components/ImageTool.tsx`: image form, API call, preview save.
- Create `src/components/VideoTool.tsx`: video form, API call, preview save.
- Create `src/components/HistoryPanel.tsx`: list, filter, clear local history.
- Create `src/app/api/generate/script/route.ts`: script API route.
- Create `src/app/api/generate/image/route.ts`: image API route.
- Create `src/app/api/generate/video/route.ts`: video API route.
- Create `src/lib/providers/mock.test.ts`: provider tests.
- Create `src/lib/history.test.ts`: local history tests.
- Create `src/app/api/generate/routes.test.ts`: API route tests.
- Create `src/components/ToolTabs.test.tsx`: tab and validation smoke tests.

## Task 1: Scaffold The Next.js Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "ai-creation-mvp",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "@vitejs/plugin-react": "^4.3.4",
    "eslint": "^9.17.0",
    "eslint-config-next": "^15.0.0",
    "jsdom": "^25.0.1",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create TypeScript, Next, and Vitest config**

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

`vitest.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["@testing-library/jest-dom/vitest"],
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
```

- [ ] **Step 3: Create the app shell**

`src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Creation Workbench",
  description: "Script, image, and video generation MVP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

`src/app/page.tsx`:

```tsx
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
      <section className="workspace-placeholder">工具工作台将在后续任务中接入。</section>
    </main>
  );
}
```

- [ ] **Step 4: Create initial global CSS**

`src/app/globals.css`:

```css
:root {
  color: #18202f;
  background: #f6f7f9;
  font-family: Arial, Helvetica, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
}

button,
input,
textarea {
  font: inherit;
}

.app-shell {
  width: min(1120px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 32px 0;
}

.app-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #516071;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 8px;
  font-size: clamp(32px, 5vw, 52px);
  line-height: 1.02;
}

.subtitle {
  color: #59677a;
  line-height: 1.6;
}
```

- [ ] **Step 5: Install dependencies and verify scaffold**

Run:

```bash
npm install
npm run build
```

Expected: `npm install` completes and `npm run build` succeeds.

- [ ] **Step 6: Commit scaffold**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts vitest.config.ts src/app
git commit -m "chore: scaffold Next.js app"
```

## Task 2: Add Shared Types And Mock Providers

**Files:**
- Create: `src/types/generation.ts`
- Create: `src/lib/providers/types.ts`
- Create: `src/lib/providers/mock.ts`
- Create: `src/lib/providers/mock.test.ts`

- [ ] **Step 1: Write provider tests first**

`src/lib/providers/mock.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { mockImageProvider, mockScriptProvider, mockVideoProvider } from "./mock";

describe("mock providers", () => {
  it("generates a structured script response", async () => {
    const result = await mockScriptProvider.generateScript({
      requirement: "给咖啡店做一个新品短视频",
    });

    expect(result.type).toBe("script");
    expect(result.provider).toBe("mock");
    expect(result.content).toContain("给咖啡店做一个新品短视频");
  });

  it("generates a stable image URL", async () => {
    const result = await mockImageProvider.generateImage({ prompt: "城市夜景海报" });

    expect(result.type).toBe("image");
    expect(result.url).toMatch(/^https:\/\//);
    expect(result.prompt).toBe("城市夜景海报");
  });

  it("generates a stable video URL", async () => {
    const result = await mockVideoProvider.generateVideo({ prompt: "产品发布短片" });

    expect(result.type).toBe("video");
    expect(result.url).toMatch(/^https:\/\//);
    expect(result.prompt).toBe("产品发布短片");
  });
});
```

- [ ] **Step 2: Run provider tests and confirm failure**

Run:

```bash
npm test -- src/lib/providers/mock.test.ts
```

Expected: FAIL because provider modules do not exist.

- [ ] **Step 3: Add shared generation types**

`src/types/generation.ts`:

```ts
export type GenerationType = "script" | "image" | "video";

export type ProviderName = "mock";

export type ScriptResult = {
  type: "script";
  content: string;
  provider: ProviderName;
  createdAt: string;
};

export type ImageResult = {
  type: "image";
  url: string;
  prompt: string;
  provider: ProviderName;
  createdAt: string;
};

export type VideoResult = {
  type: "video";
  url: string;
  prompt: string;
  provider: ProviderName;
  createdAt: string;
};

export type GenerationResult = ScriptResult | ImageResult | VideoResult;

export type HistoryEntry = {
  id: string;
  type: GenerationType;
  input: string;
  result: GenerationResult;
  provider: ProviderName;
  createdAt: string;
};
```

- [ ] **Step 4: Add provider contracts**

`src/lib/providers/types.ts`:

```ts
import type { ImageResult, ScriptResult, VideoResult } from "@/types/generation";

export type ScriptInput = {
  requirement: string;
};

export type ImageInput = {
  prompt: string;
};

export type VideoInput = {
  prompt: string;
};

export type ScriptProvider = {
  generateScript(input: ScriptInput): Promise<ScriptResult>;
};

export type ImageProvider = {
  generateImage(input: ImageInput): Promise<ImageResult>;
};

export type VideoProvider = {
  generateVideo(input: VideoInput): Promise<VideoResult>;
};
```

- [ ] **Step 5: Add mock providers**

`src/lib/providers/mock.ts`:

```ts
import type { ImageProvider, ScriptProvider, VideoProvider } from "./types";

const now = () => new Date().toISOString();

export const mockScriptProvider: ScriptProvider = {
  async generateScript({ requirement }) {
    return {
      type: "script",
      content: [
        `主题：${requirement}`,
        "",
        "镜头 1：3 秒开场，用一句直接的问题抓住注意力。",
        "旁白：你有没有遇到过这样的需求，需要快速把想法变成可发布内容？",
        "",
        "镜头 2：展示核心卖点，突出脚本、图片、视频三类产出。",
        "旁白：输入目标、风格和受众，系统会生成第一版创作素材。",
        "",
        "镜头 3：结尾行动号召。",
        "旁白：保存结果，继续迭代，直到内容可以交付。",
      ].join("\n"),
      provider: "mock",
      createdAt: now(),
    };
  },
};

export const mockImageProvider: ImageProvider = {
  async generateImage({ prompt }) {
    return {
      type: "image",
      url: "https://picsum.photos/seed/ai-creation-mvp/960/540",
      prompt,
      provider: "mock",
      createdAt: now(),
    };
  },
};

export const mockVideoProvider: VideoProvider = {
  async generateVideo({ prompt }) {
    return {
      type: "video",
      url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      prompt,
      provider: "mock",
      createdAt: now(),
    };
  },
};
```

- [ ] **Step 6: Run provider tests and commit**

Run:

```bash
npm test -- src/lib/providers/mock.test.ts
```

Expected: PASS.

Commit:

```bash
git add src/types/generation.ts src/lib/providers src/lib/providers/mock.test.ts
git commit -m "feat: add mock generation providers"
```

## Task 3: Add API Routes And Validation

**Files:**
- Create: `src/lib/api/validation.ts`
- Create: `src/app/api/generate/script/route.ts`
- Create: `src/app/api/generate/image/route.ts`
- Create: `src/app/api/generate/video/route.ts`
- Create: `src/app/api/generate/routes.test.ts`

- [ ] **Step 1: Write API route tests**

`src/app/api/generate/routes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { POST as postImage } from "./image/route";
import { POST as postScript } from "./script/route";
import { POST as postVideo } from "./video/route";

const request = (body: unknown) =>
  new Request("http://localhost/api/generate/test", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

describe("generation API routes", () => {
  it("returns script results", async () => {
    const response = await postScript(request({ requirement: "餐饮店开业宣传" }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.type).toBe("script");
    expect(json.content).toContain("餐饮店开业宣传");
  });

  it("returns image results", async () => {
    const response = await postImage(request({ prompt: "科技感产品海报" }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.type).toBe("image");
    expect(json.url).toMatch(/^https:\/\//);
  });

  it("returns video results", async () => {
    const response = await postVideo(request({ prompt: "新品发布视频" }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.type).toBe("video");
    expect(json.url).toMatch(/^https:\/\//);
  });

  it("rejects empty input", async () => {
    const response = await postImage(request({ prompt: " " }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Prompt is required.");
  });
});
```

- [ ] **Step 2: Run API tests and confirm failure**

Run:

```bash
npm test -- src/app/api/generate/routes.test.ts
```

Expected: FAIL because API route files do not exist.

- [ ] **Step 3: Add validation helper**

`src/lib/api/validation.ts`:

```ts
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return typeof body === "object" && body !== null && !Array.isArray(body) ? body : {};
  } catch {
    return {};
  }
}

export function requireStringField(
  body: Record<string, unknown>,
  field: "prompt" | "requirement",
): string {
  const value = body[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(field === "prompt" ? "Prompt is required." : "Requirement is required.");
  }

  return value.trim();
}
```

- [ ] **Step 4: Add API routes**

`src/app/api/generate/script/route.ts`:

```ts
import { NextResponse } from "next/server";
import { readJson, requireStringField } from "@/lib/api/validation";
import { mockScriptProvider } from "@/lib/providers/mock";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const requirement = requireStringField(body, "requirement");
    const result = await mockScriptProvider.generateScript({ requirement });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Script generation failed.";
    const status = message === "Requirement is required." ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
```

`src/app/api/generate/image/route.ts`:

```ts
import { NextResponse } from "next/server";
import { readJson, requireStringField } from "@/lib/api/validation";
import { mockImageProvider } from "@/lib/providers/mock";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const prompt = requireStringField(body, "prompt");
    const result = await mockImageProvider.generateImage({ prompt });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image generation failed.";
    const status = message === "Prompt is required." ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
```

`src/app/api/generate/video/route.ts`:

```ts
import { NextResponse } from "next/server";
import { readJson, requireStringField } from "@/lib/api/validation";
import { mockVideoProvider } from "@/lib/providers/mock";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const prompt = requireStringField(body, "prompt");
    const result = await mockVideoProvider.generateVideo({ prompt });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Video generation failed.";
    const status = message === "Prompt is required." ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
```

- [ ] **Step 5: Run API tests and commit**

Run:

```bash
npm test -- src/app/api/generate/routes.test.ts
```

Expected: PASS.

Commit:

```bash
git add src/lib/api src/app/api/generate
git commit -m "feat: add generation API routes"
```

## Task 4: Add Local History

**Files:**
- Create: `src/lib/history.ts`
- Create: `src/lib/history.test.ts`

- [ ] **Step 1: Write local history tests**

`src/lib/history.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { addHistoryEntry, clearHistory, getHistory } from "./history";
import type { ScriptResult } from "@/types/generation";

const result: ScriptResult = {
  type: "script",
  content: "测试脚本",
  provider: "mock",
  createdAt: "2026-05-19T00:00:00.000Z",
};

describe("local history", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("adds newest entries first", () => {
    addHistoryEntry({ type: "script", input: "第一个", result });
    addHistoryEntry({ type: "script", input: "第二个", result });

    expect(getHistory()).toHaveLength(2);
    expect(getHistory()[0].input).toBe("第二个");
  });

  it("clears entries", () => {
    addHistoryEntry({ type: "script", input: "测试", result });
    clearHistory();

    expect(getHistory()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run history tests and confirm failure**

Run:

```bash
npm test -- src/lib/history.test.ts
```

Expected: FAIL because `src/lib/history.ts` does not exist.

- [ ] **Step 3: Add local history helper**

`src/lib/history.ts`:

```ts
import type { GenerationResult, GenerationType, HistoryEntry } from "@/types/generation";

export const HISTORY_STORAGE_KEY = "ai-creation-history:v1";

type NewHistoryEntry = {
  type: GenerationType;
  input: string;
  result: GenerationResult;
};

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addHistoryEntry(entry: NewHistoryEntry): HistoryEntry {
  const createdAt = new Date().toISOString();
  const saved: HistoryEntry = {
    id: `${createdAt}-${Math.random().toString(36).slice(2)}`,
    type: entry.type,
    input: entry.input,
    result: entry.result,
    provider: entry.result.provider,
    createdAt,
  };

  const next = [saved, ...getHistory()].slice(0, 50);
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
  return saved;
}

export function clearHistory() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
  }
}
```

- [ ] **Step 4: Run history tests and commit**

Run:

```bash
npm test -- src/lib/history.test.ts
```

Expected: PASS.

Commit:

```bash
git add src/lib/history.ts src/lib/history.test.ts
git commit -m "feat: add local generation history"
```

## Task 5: Build The Tabbed Tool UI

**Files:**
- Create: `src/components/ToolTabs.tsx`
- Create: `src/components/ResultCard.tsx`
- Create: `src/components/ScriptTool.tsx`
- Create: `src/components/ImageTool.tsx`
- Create: `src/components/VideoTool.tsx`
- Create: `src/components/HistoryPanel.tsx`
- Create: `src/components/ToolTabs.test.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write component smoke tests**

`src/components/ToolTabs.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ToolTabs } from "./ToolTabs";

describe("ToolTabs", () => {
  it("switches between tools", async () => {
    render(<ToolTabs />);

    expect(screen.getByRole("heading", { name: "写脚本" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "生图" }));
    expect(screen.getByRole("heading", { name: "生图" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "生视频" }));
    expect(screen.getByRole("heading", { name: "生视频" })).toBeInTheDocument();
  });

  it("shows validation for empty script input", async () => {
    render(<ToolTabs />);

    await userEvent.click(screen.getByRole("button", { name: "生成脚本" }));
    expect(screen.getByText("请输入脚本需求。")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run component tests and confirm failure**

Run:

```bash
npm test -- src/components/ToolTabs.test.tsx
```

Expected: FAIL because component files do not exist.

- [ ] **Step 3: Add result rendering**

Replace `src/app/page.tsx` so the home page uses the tabbed workspace:

```tsx
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
```

`src/components/ResultCard.tsx`:

```tsx
import type { GenerationResult } from "@/types/generation";

type ResultCardProps = {
  result: GenerationResult | null;
};

export function ResultCard({ result }: ResultCardProps) {
  if (!result) {
    return <div className="result-empty">生成结果会显示在这里。</div>;
  }

  if (result.type === "script") {
    return <pre className="script-result">{result.content}</pre>;
  }

  if (result.type === "image") {
    return <img className="media-preview" src={result.url} alt={result.prompt} />;
  }

  return (
    <video className="media-preview" src={result.url} controls>
      <track kind="captions" />
    </video>
  );
}
```

- [ ] **Step 4: Add tool tabs**

`src/components/ToolTabs.tsx`:

```tsx
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
```

- [ ] **Step 5: Add the three tool components and history panel**

`src/components/ScriptTool.tsx`:

```tsx
"use client";

import { useState } from "react";
import { addHistoryEntry } from "@/lib/history";
import type { ScriptResult } from "@/types/generation";
import { ResultCard } from "./ResultCard";

type ScriptToolProps = {
  onSaved: () => void;
};

export function ScriptTool({ onSaved }: ScriptToolProps) {
  const [requirement, setRequirement] = useState("");
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function generate() {
    const trimmed = requirement.trim();
    if (!trimmed) {
      setError("请输入脚本需求。");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate/script", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requirement: trimmed }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "脚本生成失败。");
      }

      setResult(payload);
      addHistoryEntry({ type: "script", input: trimmed, result: payload });
      onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "脚本生成失败。");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyResult() {
    if (result) {
      await navigator.clipboard.writeText(result.content);
    }
  }

  return (
    <div className="tool-grid">
      <section className="tool-form" aria-labelledby="script-heading">
        <h2 id="script-heading">写脚本</h2>
        <label className="field">
          <span>需求</span>
          <textarea
            value={requirement}
            onChange={(event) => setRequirement(event.target.value)}
            placeholder="例如：给咖啡店新品拿铁写一个 30 秒短视频脚本"
            rows={8}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="button" onClick={generate} disabled={isLoading}>
          {isLoading ? "生成中..." : "生成脚本"}
        </button>
      </section>

      <section className="result-panel">
        <div className="panel-title">
          <h3>结果</h3>
          <button type="button" onClick={copyResult} disabled={!result}>
            复制
          </button>
        </div>
        <ResultCard result={result} />
      </section>
    </div>
  );
}
```

`src/components/ImageTool.tsx`:

```tsx
"use client";

import { useState } from "react";
import { addHistoryEntry } from "@/lib/history";
import type { ImageResult } from "@/types/generation";
import { ResultCard } from "./ResultCard";

type ImageToolProps = {
  onSaved: () => void;
};

export function ImageTool({ onSaved }: ImageToolProps) {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<ImageResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function generate() {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("请输入图片提示词。");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "图片生成失败。");
      }

      setResult(payload);
      addHistoryEntry({ type: "image", input: trimmed, result: payload });
      onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "图片生成失败。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="tool-grid">
      <section className="tool-form" aria-labelledby="image-heading">
        <h2 id="image-heading">生图</h2>
        <label className="field">
          <span>提示词</span>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="例如：一张科技感新品发布海报，冷静专业，高级灰背景"
            rows={8}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="button" onClick={generate} disabled={isLoading}>
          {isLoading ? "生成中..." : "生成图片"}
        </button>
      </section>

      <section className="result-panel">
        <div className="panel-title">
          <h3>结果</h3>
        </div>
        <ResultCard result={result} />
      </section>
    </div>
  );
}
```

`src/components/VideoTool.tsx`:

```tsx
"use client";

import { useState } from "react";
import { addHistoryEntry } from "@/lib/history";
import type { VideoResult } from "@/types/generation";
import { ResultCard } from "./ResultCard";

type VideoToolProps = {
  onSaved: () => void;
};

export function VideoTool({ onSaved }: VideoToolProps) {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<VideoResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function generate() {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("请输入视频描述。");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate/video", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "视频生成失败。");
      }

      setResult(payload);
      addHistoryEntry({ type: "video", input: trimmed, result: payload });
      onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "视频生成失败。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="tool-grid">
      <section className="tool-form" aria-labelledby="video-heading">
        <h2 id="video-heading">生视频</h2>
        <label className="field">
          <span>视频描述</span>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="例如：15 秒产品发布短片，快节奏剪辑，突出三项功能"
            rows={8}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="button" onClick={generate} disabled={isLoading}>
          {isLoading ? "生成中..." : "生成视频"}
        </button>
      </section>

      <section className="result-panel">
        <div className="panel-title">
          <h3>结果</h3>
        </div>
        <ResultCard result={result} />
      </section>
    </div>
  );
}
```

`src/components/HistoryPanel.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { clearHistory, getHistory } from "@/lib/history";
import type { HistoryEntry } from "@/types/generation";

type HistoryPanelProps = {
  version: number;
  onCleared: () => void;
};

export function HistoryPanel({ version, onCleared }: HistoryPanelProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(getHistory());
  }, [version]);

  function clear() {
    clearHistory();
    setEntries([]);
    onCleared();
  }

  return (
    <section className="history-panel" aria-labelledby="history-heading">
      <div className="panel-title">
        <div>
          <h2 id="history-heading">历史</h2>
          <p className="subtitle">最近 50 条结果保存在当前浏览器。</p>
        </div>
        <button type="button" onClick={clear} disabled={entries.length === 0}>
          清空
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="result-empty">还没有保存的生成结果。</div>
      ) : (
        <div className="history-list">
          {entries.map((entry) => (
            <article className="history-item" key={entry.id}>
              <div>
                <strong>{entry.type}</strong>
                <p>{entry.input}</p>
              </div>
              <time>{new Date(entry.createdAt).toLocaleString("zh-CN")}</time>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 6: Add compact workspace CSS**

Append this to `src/app/globals.css`:

```css
.workspace {
  background: #ffffff;
  border: 1px solid #dde3ea;
  border-radius: 8px;
  box-shadow: 0 18px 50px rgba(27, 39, 59, 0.08);
  overflow: hidden;
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 10px;
  border-bottom: 1px solid #dde3ea;
  background: #f9fafb;
}

.tab {
  border: 0;
  border-radius: 6px;
  padding: 10px 14px;
  background: transparent;
  color: #445166;
  cursor: pointer;
}

.tab.active {
  background: #18202f;
  color: #ffffff;
}

.tool-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(320px, 1.1fr);
  gap: 24px;
  padding: 24px;
}

.tool-form,
.result-panel,
.history-panel {
  min-width: 0;
}

.field {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
  color: #2c3748;
  font-weight: 700;
}

textarea {
  width: 100%;
  resize: vertical;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 12px;
  color: #18202f;
  background: #ffffff;
  line-height: 1.5;
}

button {
  border: 1px solid #18202f;
  border-radius: 6px;
  padding: 10px 14px;
  background: #18202f;
  color: #ffffff;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.error {
  color: #b42318;
  font-weight: 700;
}

.result-empty {
  display: grid;
  min-height: 260px;
  place-items: center;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #64748b;
  background: #f8fafc;
}

.script-result {
  min-height: 260px;
  margin: 0;
  padding: 16px;
  overflow: auto;
  white-space: pre-wrap;
  border: 1px solid #dde3ea;
  border-radius: 8px;
  background: #0f172a;
  color: #e2e8f0;
  line-height: 1.6;
}

.media-preview {
  display: block;
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  border: 1px solid #dde3ea;
  border-radius: 8px;
  background: #0f172a;
}

.history-panel {
  padding: 24px;
}

.history-list {
  display: grid;
  gap: 12px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border: 1px solid #dde3ea;
  border-radius: 8px;
  background: #ffffff;
}

.history-item p {
  margin: 6px 0 0;
  color: #59677a;
}

.history-item time {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 760px) {
  .app-shell {
    width: min(100vw - 20px, 1120px);
    padding: 20px 0;
  }

  .tabs {
    overflow-x: auto;
  }

  .tool-grid {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .history-item {
    display: grid;
  }
}
```

- [ ] **Step 7: Run component tests and build**

Run:

```bash
npm test -- src/components/ToolTabs.test.tsx
npm run build
```

Expected: PASS.

- [ ] **Step 8: Commit UI**

```bash
git add src/components src/app/page.tsx src/app/globals.css
git commit -m "feat: add tabbed creation workspace"
```

## Task 6: Run Full Validation And Smoke Test

**Files:**
- Modify only if validation exposes a scoped bug in files from previous tasks.

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Start dev server**

```bash
npm run dev
```

Expected: server starts on `http://localhost:3000` unless the port is occupied.

- [ ] **Step 4: Browser smoke test**

Open the local URL in the in-app browser and verify:

- All four tabs switch correctly.
- Empty script input shows `请输入脚本需求。`.
- Script generation returns text.
- Image generation shows an image preview.
- Video generation shows a video preview.
- Each successful result appears in the History tab.
- Clear history removes saved entries.

- [ ] **Step 5: Commit validation fixes if needed**

If smoke testing required code changes:

```bash
git add src package.json package-lock.json tsconfig.json next.config.ts vitest.config.ts
git commit -m "fix: polish MVP smoke test issues"
```

If no changes were needed, do not create an empty commit.

## Self-Review

Spec coverage:

- Next.js full-stack app: Task 1.
- Three independent tools: Task 5.
- Provider interfaces and mock implementations: Task 2.
- Three API routes: Task 3.
- Browser local history: Task 4 and Task 5.
- Tabbed workspace: Task 5.
- Error and loading states: Task 5.
- Build, tests, and browser smoke validation: Task 6.

Placeholder scan:

- No unresolved placeholder markers or unspecified future implementation markers are required to complete the MVP.
- UI component and CSS steps include concrete file content for the MVP.

Type consistency:

- `GenerationResult`, `HistoryEntry`, provider inputs, and route response shapes match the design spec.
- Route field names use `requirement` for scripts and `prompt` for image/video.
- Storage key is `ai-creation-history:v1`.

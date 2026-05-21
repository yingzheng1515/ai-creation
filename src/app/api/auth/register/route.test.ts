import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST } from "./route";

const registerRequest = (body: unknown) =>
  new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("register API route", () => {
  let tempDir = "";
  const originalHistoryDataDir = process.env.HISTORY_DATA_DIR;
  const originalSessionSecret = process.env.SESSION_SECRET;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ai-register-"));
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

  it("creates a new account and sets a signed account session cookie", async () => {
    const response = await POST(registerRequest({ accountName: "Ying Zheng", accessCode: "open-2026" }));
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.isNew).toBe(true);
    expect(payload.user).toEqual(
      expect.objectContaining({
        accountName: "ying zheng",
        isAuthenticated: true,
        label: "Ying Zheng",
      }),
    );
    expect(payload.user.id).toMatch(/^acct_/);
    expect(response.headers.get("set-cookie")).toContain("ai_creation_session=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("rejects duplicate account names", async () => {
    await POST(registerRequest({ accountName: "creator", accessCode: "same-code" }));

    const response = await POST(registerRequest({ accountName: " CREATOR ", accessCode: "other-code" }));
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error).toBe("账号已存在，请直接登录。");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("validates account credentials", async () => {
    const response = await POST(registerRequest({ accountName: "a", accessCode: "123" }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("请输入 2-64 位账号名和至少 6 位访问码。");
  });
});

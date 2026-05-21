import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST } from "./route";
import { registerAccount } from "@/lib/auth-store";

const loginRequest = (body: unknown) =>
  new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("login API route", () => {
  let tempDir = "";
  const originalHistoryDataDir = process.env.HISTORY_DATA_DIR;
  const originalSessionSecret = process.env.SESSION_SECRET;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ai-login-"));
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

  it("logs in an existing account and sets a signed account session cookie", async () => {
    await registerAccount("Ying Zheng", "open-2026");

    const response = await POST(loginRequest({ accountName: "Ying Zheng", accessCode: "open-2026" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
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

  it("reuses an existing account with the correct access code", async () => {
    await registerAccount("creator", "same-code");

    const first = await POST(loginRequest({ accountName: "creator", accessCode: "same-code" }));
    const firstPayload = await first.json();
    const second = await POST(loginRequest({ accountName: " CREATOR ", accessCode: "same-code" }));
    const secondPayload = await second.json();

    expect(second.status).toBe(200);
    expect(secondPayload.user.id).toBe(firstPayload.user.id);
    expect(secondPayload.user.accountName).toBe("creator");
  });

  it("rejects an existing account with the wrong access code", async () => {
    await registerAccount("creator", "right-code");

    const response = await POST(loginRequest({ accountName: "creator", accessCode: "wrong-code" }));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe("账号或访问码不正确。");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects a missing account instead of creating it", async () => {
    const response = await POST(loginRequest({ accountName: "new-account", accessCode: "open-2026" }));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe("账号或访问码不正确。");
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});

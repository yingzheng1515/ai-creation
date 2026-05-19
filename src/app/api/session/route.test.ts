import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET } from "./route";
import { createOrLoginAccount } from "@/lib/auth-store";
import { createAccountSessionCookie } from "@/lib/session";

describe("session API route", () => {
  let tempDir = "";
  const originalHistoryDataDir = process.env.HISTORY_DATA_DIR;
  const originalSessionSecret = process.env.SESSION_SECRET;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ai-session-"));
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

  it("issues a visitor session cookie when none exists", async () => {
    const response = await GET(new Request("http://localhost/api/session"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.user.id).toMatch(/^usr_/);
    expect(payload.user.label).toMatch(/^访客 /);
    expect(response.headers.get("set-cookie")).toContain("ai_creation_session=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=Lax");
    expect(response.headers.get("set-cookie")).not.toContain("Secure");
  });

  it("marks the session cookie secure behind https", async () => {
    const response = await GET(
      new Request("http://localhost/api/session", {
        headers: { "x-forwarded-proto": "https" },
      }),
    );

    expect(response.headers.get("set-cookie")).toContain("Secure");
  });

  it("reuses an existing visitor session cookie", async () => {
    const response = await GET(
      new Request("http://localhost/api/session", {
        headers: { cookie: "ai_creation_session=usr_existing123" },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.user.id).toBe("usr_existing123");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("returns authenticated account metadata for a signed account cookie", async () => {
    const account = await createOrLoginAccount("Creator", "account-code");
    const cookie = createAccountSessionCookie(account.user.id, new Request("http://localhost/api/session"));
    const response = await GET(
      new Request("http://localhost/api/session", {
        headers: { cookie },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.user).toEqual({
      id: account.user.id,
      label: "Creator",
      accountName: "creator",
      isAuthenticated: true,
    });
  });
});

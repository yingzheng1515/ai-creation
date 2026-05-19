import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DELETE, GET, POST } from "./route";
import { createOrLoginAccount } from "@/lib/auth-store";
import { createAccountSessionCookie } from "@/lib/session";
import type { ScriptResult } from "@/types/generation";

const scriptResult: ScriptResult = {
  type: "script",
  content: "服务器保存的脚本",
  provider: "mock",
  createdAt: "2026-05-19T00:00:00.000Z",
};

const jsonRequest = (body: unknown, cookie = "ai_creation_session=usr_default123") =>
  new Request("http://localhost/api/history", {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify(body),
  });

const getRequest = (cookie = "ai_creation_session=usr_default123") =>
  new Request("http://localhost/api/history", {
    headers: { cookie },
  });

const deleteRequest = (cookie = "ai_creation_session=usr_default123") =>
  new Request("http://localhost/api/history", {
    method: "DELETE",
    headers: { cookie },
  });

describe("history API route", () => {
  let tempDir = "";
  const originalHistoryFilePath = process.env.HISTORY_FILE_PATH;
  const originalSessionSecret = process.env.SESSION_SECRET;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ai-history-"));
    process.env.HISTORY_FILE_PATH = join(tempDir, "history.json");
    process.env.SESSION_SECRET = "test-session-secret";
  });

  afterEach(async () => {
    if (originalHistoryFilePath === undefined) {
      delete process.env.HISTORY_FILE_PATH;
    } else {
      process.env.HISTORY_FILE_PATH = originalHistoryFilePath;
    }

    if (originalSessionSecret === undefined) {
      delete process.env.SESSION_SECRET;
    } else {
      process.env.SESSION_SECRET = originalSessionSecret;
    }

    await rm(tempDir, { recursive: true, force: true });
  });

  it("saves and lists generated history entries", async () => {
    const postResponse = await POST(
      jsonRequest({
        type: "script",
        input: "水墨江南宣传片",
        result: scriptResult,
      }),
    );
    const saved = await postResponse.json();

    expect(postResponse.status).toBe(201);
    expect(saved.type).toBe("script");
    expect(saved.input).toBe("水墨江南宣传片");
    expect(saved.result).toEqual(scriptResult);

    const getResponse = await GET(getRequest());
    const listed = await getResponse.json();

    expect(getResponse.status).toBe(200);
    expect(listed.entries).toEqual([saved]);
  });

  it("keeps generated history isolated by visitor session", async () => {
    const userOneRequest = new Request("http://localhost/api/history", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "ai_creation_session=usr_one123" },
      body: JSON.stringify({ type: "script", input: "用户一", result: scriptResult }),
    });
    const userTwoRequest = new Request("http://localhost/api/history", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "ai_creation_session=usr_two123" },
      body: JSON.stringify({ type: "script", input: "用户二", result: scriptResult }),
    });

    await POST(userOneRequest);
    await POST(userTwoRequest);

    const userOneResponse = await GET(
      new Request("http://localhost/api/history", {
        headers: { cookie: "ai_creation_session=usr_one123" },
      }),
    );
    const userTwoResponse = await GET(
      new Request("http://localhost/api/history", {
        headers: { cookie: "ai_creation_session=usr_two123" },
      }),
    );

    expect((await userOneResponse.json()).entries).toEqual([
      expect.objectContaining({ input: "用户一" }),
    ]);
    expect((await userTwoResponse.json()).entries).toEqual([
      expect.objectContaining({ input: "用户二" }),
    ]);
  });

  it("keeps account history separate from visitor history", async () => {
    const account = await createOrLoginAccount("Creator", "account-code");
    const accountCookie = createAccountSessionCookie(account.user.id, new Request("http://localhost/api/history"));

    await POST(
      jsonRequest(
        {
          type: "script",
          input: "账号作品",
          result: scriptResult,
        },
        accountCookie,
      ),
    );

    const accountResponse = await GET(
      new Request("http://localhost/api/history", {
        headers: { cookie: accountCookie },
      }),
    );
    const visitorResponse = await GET(getRequest("ai_creation_session=usr_visitor123"));

    expect((await accountResponse.json()).entries).toEqual([
      expect.objectContaining({ input: "账号作品" }),
    ]);
    expect((await visitorResponse.json()).entries).toEqual([]);
  });

  it("rejects malformed history entries", async () => {
    const response = await POST(jsonRequest({ type: "image", input: "坏数据" }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid history entry.");
  });

  it("clears saved history entries", async () => {
    await POST(jsonRequest({ type: "script", input: "测试", result: scriptResult }));

    const deleteResponse = await DELETE(deleteRequest());
    const json = await deleteResponse.json();

    expect(deleteResponse.status).toBe(200);
    expect(json.entries).toEqual([]);

    const getResponse = await GET(getRequest());
    expect(await getResponse.json()).toEqual({ entries: [] });
  });
});

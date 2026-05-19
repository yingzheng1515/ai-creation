import { isRecord } from "./history-schema";

export type ClientSession = {
  id: string;
  label: string;
  accountName?: string;
  isAuthenticated: boolean;
};

function fallbackSession(): ClientSession {
  return { id: "unknown", label: "访客空间", isAuthenticated: false };
}

function parseSessionPayload(payload: unknown): ClientSession {
  const user = isRecord(payload) ? payload.user : null;

  if (!isRecord(user) || typeof user.id !== "string" || typeof user.label !== "string") {
    return fallbackSession();
  }

  return {
    id: user.id,
    label: user.label,
    accountName: typeof user.accountName === "string" ? user.accountName : undefined,
    isAuthenticated: user.isAuthenticated === true,
  };
}

export async function getSession(): Promise<ClientSession> {
  try {
    const response = await fetch("/api/session", { method: "GET" });
    if (!response.ok) {
      return fallbackSession();
    }

    return parseSessionPayload(await response.json());
  } catch {
    return fallbackSession();
  }
}

export async function login(accountName: string, accessCode: string): Promise<ClientSession> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ accountName, accessCode }),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(isRecord(payload) && typeof payload.error === "string" ? payload.error : "登录失败。");
  }

  return parseSessionPayload(payload);
}

export async function logout(): Promise<ClientSession> {
  const response = await fetch("/api/auth/logout", { method: "POST" });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(isRecord(payload) && typeof payload.error === "string" ? payload.error : "退出失败。");
  }

  return parseSessionPayload(payload);
}

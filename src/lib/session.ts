import { createHmac, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";

export const SESSION_COOKIE_NAME = "ai_creation_session";
export const AUTH_REQUIRED_MESSAGE = "请先登录后再继续。";

export type VisitorSession = {
  userId: string;
  label: string;
  isAuthenticated: boolean;
  setCookie?: string;
};

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const SESSION_ID_PATTERN = /^usr_[a-zA-Z0-9_-]{6,80}$/;
const ACCOUNT_ID_PATTERN = /^acct_[a-f0-9]{24}$/;
const SIGNED_COOKIE_PREFIX = "v1.";

function parseCookieHeader(header: string | null): Record<string, string> {
  if (!header) {
    return {};
  }

  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf("=");
        if (separatorIndex === -1) {
          return [part, ""];
        }

        return [
          decodeURIComponent(part.slice(0, separatorIndex)),
          decodeURIComponent(part.slice(separatorIndex + 1)),
        ];
      }),
  );
}

function createSessionId() {
  return `usr_${crypto.randomUUID().replaceAll("-", "")}`;
}

function shouldUseSecureCookie(request: Request) {
  if (process.env.SESSION_COOKIE_SECURE === "true") {
    return true;
  }

  if (process.env.SESSION_COOKIE_SECURE === "false") {
    return false;
  }

  return request.url.startsWith("https://") || request.headers.get("x-forwarded-proto") === "https";
}

function serializeSessionCookie(userId: string, request: Request) {
  const secureFlag = shouldUseSecureCookie(request) ? "; Secure" : "";

  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(userId)}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax${secureFlag}`;
}

function signingSecret() {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production.");
  }

  return "ai-creation-development-session-secret";
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

function verifySignature(payload: string, signature: string) {
  const expected = Buffer.from(signPayload(payload));
  const actual = Buffer.from(signature);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function parseSignedAccountCookie(value: string | undefined) {
  if (!value?.startsWith(SIGNED_COOKIE_PREFIX)) {
    return null;
  }

  const [, payload, signature] = value.split(".");
  if (!payload || !signature || !verifySignature(payload, signature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload));
    if (typeof parsed.userId === "string" && ACCOUNT_ID_PATTERN.test(parsed.userId)) {
      return parsed.userId;
    }
  } catch {
    return null;
  }

  return null;
}

export function createAccountSessionCookie(userId: string, request: Request) {
  if (!ACCOUNT_ID_PATTERN.test(userId)) {
    throw new Error("Invalid account session id.");
  }

  const payload = base64UrlEncode(JSON.stringify({ userId, kind: "account" }));
  const signedValue = `${SIGNED_COOKIE_PREFIX}${payload}.${signPayload(payload)}`;

  return serializeSessionCookie(signedValue, request);
}

export function labelForUserId(userId: string) {
  return `访客 ${userId.slice(-6)}`;
}

export function getVisitorSession(request: Request): VisitorSession {
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const existingUserId = cookies[SESSION_COOKIE_NAME];
  const accountUserId = parseSignedAccountCookie(existingUserId);

  if (accountUserId) {
    return {
      userId: accountUserId,
      label: "账号空间",
      isAuthenticated: true,
    };
  }

  if (SESSION_ID_PATTERN.test(existingUserId ?? "")) {
    return {
      userId: existingUserId,
      label: labelForUserId(existingUserId),
      isAuthenticated: false,
    };
  }

  const userId = createSessionId();

  return {
    userId,
    label: labelForUserId(userId),
    isAuthenticated: false,
    setCookie: serializeSessionCookie(userId, request),
  };
}

export function createVisitorSession(request: Request): VisitorSession {
  const userId = createSessionId();

  return {
    userId,
    label: labelForUserId(userId),
    isAuthenticated: false,
    setCookie: serializeSessionCookie(userId, request),
  };
}

export function applySessionCookie(response: Response, session: VisitorSession) {
  if (session.setCookie) {
    response.headers.set("set-cookie", session.setCookie);
  }

  return response;
}

export function isAuthenticatedSession(session: VisitorSession) {
  return session.isAuthenticated;
}

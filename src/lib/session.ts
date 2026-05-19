export const SESSION_COOKIE_NAME = "ai_creation_session";

export type VisitorSession = {
  userId: string;
  label: string;
  setCookie?: string;
};

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const SESSION_ID_PATTERN = /^usr_[a-zA-Z0-9_-]{6,80}$/;

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

export function labelForUserId(userId: string) {
  return `访客 ${userId.slice(-6)}`;
}

export function getVisitorSession(request: Request): VisitorSession {
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const existingUserId = cookies[SESSION_COOKIE_NAME];

  if (SESSION_ID_PATTERN.test(existingUserId ?? "")) {
    return {
      userId: existingUserId,
      label: labelForUserId(existingUserId),
    };
  }

  const userId = createSessionId();

  return {
    userId,
    label: labelForUserId(userId),
    setCookie: serializeSessionCookie(userId, request),
  };
}

export function applySessionCookie(response: Response, session: VisitorSession) {
  if (session.setCookie) {
    response.headers.set("set-cookie", session.setCookie);
  }

  return response;
}

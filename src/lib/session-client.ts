import { isRecord } from "./history-schema";

export type ClientSession = {
  id: string;
  label: string;
};

export async function getSession(): Promise<ClientSession> {
  try {
    const response = await fetch("/api/session", { method: "GET" });
    if (!response.ok) {
      return { id: "unknown", label: "访客空间" };
    }

    const payload = await response.json();
    const user = isRecord(payload) ? payload.user : null;

    if (!isRecord(user) || typeof user.id !== "string" || typeof user.label !== "string") {
      return { id: "unknown", label: "访客空间" };
    }

    return {
      id: user.id,
      label: user.label,
    };
  } catch {
    return { id: "unknown", label: "访客空间" };
  }
}

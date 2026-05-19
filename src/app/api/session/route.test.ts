import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("session API route", () => {
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
});

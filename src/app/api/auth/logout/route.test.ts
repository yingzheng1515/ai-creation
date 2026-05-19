import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("logout API route", () => {
  it("returns the browser to a visitor session", async () => {
    const response = await POST(new Request("http://localhost/api/auth/logout", { method: "POST" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.user.id).toMatch(/^usr_/);
    expect(payload.user.isAuthenticated).toBe(false);
    expect(response.headers.get("set-cookie")).toContain("ai_creation_session=");
  });
});

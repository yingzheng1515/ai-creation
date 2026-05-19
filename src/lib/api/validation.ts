export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return typeof body === "object" && body !== null && !Array.isArray(body) ? body : {};
  } catch {
    return {};
  }
}

export function requireStringField(
  body: Record<string, unknown>,
  field: "prompt" | "requirement",
): string {
  const value = body[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(field === "prompt" ? "Prompt is required." : "Requirement is required.");
  }

  return value.trim();
}
